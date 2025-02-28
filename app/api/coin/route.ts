import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import db from "@/lib/database";
import { RowDataPacket } from "mysql2";
import moment from "moment";
import { execSync } from "child_process";

let insertingMac: string | null = null;
let timer: NodeJS.Timeout | null = null;
let seconds = 0;
let totalCoins = 0;
let isCSOpen = false;

const max = 10;

function reset() {
  insertingMac = null;
  clearInterval(timer!);
  timer = null;
  totalCoins = 0;
}

async function stop(server: import("ws").WebSocketServer, client: import("ws").WebSocket, mac: string) {
  server.clients.forEach(c => {
    if(c.protocol == "arduino") {
      c.send(JSON.stringify({from: "server", secret: "secret", value: "closeslot"}));
    }
  }); 

  if (totalCoins > 0) {
    await db.execute(`
      UPDATE clients
      SET expire_on = IF(expire_on > NOW(), DATE_ADD(expire_on, INTERVAL ? MINUTE), DATE_ADD(NOW(), INTERVAL ? MINUTE))
      WHERE mac = ?`, [totalCoins * 1, totalCoins * 1, mac]);
  
    const [final] = await db.execute<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [mac]);
  
    const expiryDate = moment(final[0].expire_on);
    const timeout = expiryDate.diff(moment(), 'seconds');
    
    execSync(`ipset add allowed_macs ${mac} timeout ${timeout >= 2147483 ? 2147483 : timeout} -exist`); 
  }

  // client.send(JSON.stringify({from: "server", value: "closeslot"})); 
  reset();
}

const secret = "secret";

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
            server.clients.forEach(c => {
              if(c.protocol == "arduino") {
                c.send(JSON.stringify({from: "server", secret: "secret", value: "openslot"}));
              }
            }); 
            seconds = max * 1000;

            timer = setInterval(() => {
              if (!isCSOpen) {
                reset();
              }
              client.send(JSON.stringify({from: "timer", for: insertingMac, timeleft: (seconds / (max * 1000)) * 100 - 10}));
              if (seconds <= 0) {
                stop(server, client, insertingMac || "");
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
            stop(server, client, insertingMac || "");
          }
        }
      }

      if (data.from == "coinslot" && data.secret == secret) {
        if (data.type == "coin") {
          seconds = max * 1000;
          totalCoins += +data.value;
          server.clients.forEach(c => {
            if (c.protocol != "arduino") {
              c.send(JSON.stringify({from: "totalcoin", value: totalCoins, for: insertingMac}));
            }
          });
        }
        if (data.type == "gate") {
          server.clients.forEach(c => {
            if(c.protocol != "arduino") {
              c.send(JSON.stringify({from: "coinslot", for: insertingMac, value: data.value})); 
            }
          }); 
          isCSOpen = data.value == "isOpen";
        }
      }

      console.log("Received message:", data);
    });
  
    client.on("close", () => {
      console.log("A client disconnected");

      if (info.mac || !ip && info.mac === insertingMac) {
        stop(server, client, insertingMac || "");
      }
    });
  }