import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import db from "@/lib/database";
import { RowDataPacket } from "mysql2";
import moment from "moment";
import { execSync } from "child_process";
import { serialPort } from "@/utils/serialPort";

let insertingMac: string | null = null;
let timer: NodeJS.Timeout | null = null;
let seconds = 0;
let totalCoins = 0;
let isCSOpen = false;
let isPending = false;

const secret = "secret";
const max = +(process.env.TIMEOUT || "0");

let serialInitialized = false;

function reset() {
  insertingMac = null;
  clearInterval(timer!);
  timer = null;
  totalCoins = 0;
  isCSOpen = false;
}

async function stop(server: import("ws").WebSocketServer, mac: string) {
  const coinsCopy = totalCoins;
  if (isPending) {
    setTimeout(() => {
      stop(server, insertingMac || "");
    }, seconds + 500);
    return;
  }
  console.log("MAC: ", mac)
  let timeTotal = 0;
  
  server.clients.forEach(c => {
    c.send(JSON.stringify({from: "coinslot", for: insertingMac, value: "isClose"})); 
  }); 
  serialPort.write(JSON.stringify({type: "cmd", secret, value: "close"})+"\n");

  if (totalCoins > 0 && insertingMac?.trim() != "") {
    const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM rates ORDER BY price DESC");
    const rates = rows as { price: number; time: number }[];

    console.log(rates);

    for (const r of rates) {
      const price = Number(r.price);
      
      if (isNaN(price) || price <= 0) {
        console.log(`Skipping invalid rate:`, r);
        continue;
      }
    
      if (totalCoins < price) {
        continue;
      }
    
      const ans = Math.floor(totalCoins / price); 
      totalCoins %= price; 
    
      if (ans < 1) {
        continue;
      }
    
      timeTotal += ans * r.time;
    }

    await db.execute(`
      UPDATE clients
      SET paused = 0, can_pause = 1, expire_on = IF(expire_on > NOW(), DATE_ADD(expire_on, INTERVAL ? MINUTE), DATE_ADD(NOW(), INTERVAL ? MINUTE))
      WHERE mac = ?`, [timeTotal * 1, timeTotal * 1, mac]);

    await db.execute(`
      INSERT INTO transactions VALUES(0, ?, ?)`, [coinsCopy, mac]);
  
    const [final] = await db.execute<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [mac]);
  
    const expiryDate = moment(final[0].expire_on);
    const timeout = expiryDate.diff(moment(), 'seconds');
    
    execSync(`ipset add allowed_macs ${mac} timeout ${timeout >= 2147483 ? 2147483 : timeout} -exist`); 
  }

  reset();
}

export function GET() {
  const headers = new Headers();
  headers.set('Connection', 'Upgrade');
  headers.set('Upgrade', 'websocket');
  return new Response('Upgrade Required', { status: 426, headers });
}


export async function SOCKET(
  client: import("ws").WebSocket,
  request: import("http").IncomingMessage,
  server: import("ws").WebSocketServer
) {
  const fIp = request.headers["x-forwarded-for"]?.toString() || request.socket.remoteAddress;
  const ip = fIp?.replace("::ffff:", "").split(',').shift();
  const info = await getDeviceInfoFromIp(ip);
  console.log("A client connected");
  console.log(ip)

  // console.log(server.clients)

  if (serialPort && !serialInitialized) {
    serialInitialized = true;
    
    serialPort.on('data', (data: Buffer) => {
      try {
        const json = JSON.parse(data.toString());
      
        if (json.type == "init") {
          serialPort.write(JSON.stringify({type: "status", value: "ok"})+"\n");
        }

        if (json.type == "notify") {
          isPending = true;
          seconds = max * 1000;
          server.clients.forEach(c => {
              c.send(JSON.stringify({from: "notify", for: insertingMac, value: "ok"}));
          });
          serialPort.write(JSON.stringify({type: "status", value: "ok"})+"\n");
        }

        if (json.type == "res") {
          server.clients.forEach(c => {
            c.send(JSON.stringify({from: "coinslot", for: insertingMac, value: json.value == "open" ? "isOpen" : "isClose"})); 
          }); 
          isCSOpen = json.value == "open";
        }
    
        if (json.type == "coin") {
          isPending = false;
          totalCoins += +json.value;
          setTimeout(() => {
              server.clients.forEach(c => {
                  c.send(JSON.stringify({from: "totalcoin", value: totalCoins, for: insertingMac}));
              });
          }, 700);
        }
        console.log(json)
        console.log(totalCoins)
      } catch (error) {
        console.log(error)
      }
      
    })
  }

  client.on("message", (message) => {
    const data = JSON.parse(message.toString());

    if(data.from == "user") {
      if (!info.mac || info.mac.trim() === "" || !ip) {
        client.close();
      }
      console.log(ip);

      if(info.mac && data.value == "start") {
        if(!timer || !insertingMac) {
          insertingMac = info.mac;
          serialPort.write(JSON.stringify({type: "cmd", value: "open"})+"\n");
          seconds = max * 1000;

          timer = setInterval(() => {
            if (!isCSOpen) {
              reset();
            }
            client.send(JSON.stringify({from: "timer", for: insertingMac, timeleft: (seconds / (max * 1000)) * 100 - 10}));
            if (seconds <= 0) {
              stop(server, insertingMac || "");
            }
            seconds -= 1000;
            console.log(seconds)
          }, 1000);
        } else {
          client.send(JSON.stringify({from: "server", value: "inuse"}));
        }
      }

      if(data.value == "stop") {
        if(timer && insertingMac == info.mac) {
          stop(server, insertingMac || "");
        }
      }
    }

    console.log("Received message:", data);
  });

  client.on("close", () => {
    if (info.mac && info.mac === insertingMac) {
      stop(server, insertingMac || "");
    }
  });
}
