import db from "@/lib/database";
import { RowDataPacket } from "mysql2";
import os from "os"
import { exec } from "child_process"

function getRAMUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const percentage = (usedMem / totalMem * 100).toFixed(2);

  const totalGB = (totalMem / (1024 * 1024 * 1024)).toFixed(2);
  const usedGB = (usedMem / (1024 * 1024 * 1024)).toFixed(2);

  return {
    percentage,
    text: `${usedGB}GB / ${totalGB}GB Used`
  };
}

function getCPUUsage() {
  return new Promise((resolve) => {
    const start = os.cpus();
    setTimeout(() => {
      const end = os.cpus();
      let totalDiff = 0, idleDiff = 0;

      for (let i = 0; i < start.length; i++) {
        const startCpu = start[i].times, endCpu = end[i].times;
        const startTotal = startCpu.user + startCpu.nice + startCpu.sys + startCpu.idle + startCpu.irq;
        const endTotal = endCpu.user + endCpu.nice + endCpu.sys + endCpu.idle + endCpu.irq;
        totalDiff += endTotal - startTotal;
        idleDiff += endCpu.idle - startCpu.idle;
      }

      const cpuUsage = ((1 - idleDiff / totalDiff) * 100).toFixed(2);
      resolve(cpuUsage);
    }, 1000);
  });
}

function getStorageUsage(): Promise<{ percentage: string, text: string }> {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      exec("wmic logicaldisk get size,freespace,caption", (error, stdout) => {
        if (error) {
          resolve({ percentage: "0", text: "Error" });
          return;
        }

        const lines = stdout.trim().split("\n").slice(1).map(line => line.trim()).filter(line => line);
        const driveC = lines.find(line => line.startsWith("C:")) || lines[0];

        if (driveC) {
          const parts = driveC.split(/\s+/);
          // wmic output: Caption FreeSpace Size
          // But order depends on get query? No, standard usually alphabetical or property order.
          // "wmic logicaldisk get size,freespace,caption"
          // Output columns usually match valid order? 
          // Better to parse by column? splitting by space is risky if spaces in values, but standard wmic output is tabular. 
          // "C:       12345      67890" vs "Caption FreeSpace Size"
          // Actually `wmic` output varies. Safer to rely on parsing.
          // Let's assume standard behavior or just use node's fs for this? no, `diskusage` package is better but not here.
          // Simplified approach for C drive:

          // Re-run command to be sure of column order: `wmic logicaldisk where Caption='C:' get FreeSpace,Size /value`
          exec("wmic logicaldisk where Caption='C:' get FreeSpace,Size /value", (err, out) => {
            if (err) {
              resolve({ percentage: "0", text: "Error" });
              return;
            }
            // Output:
            // FreeSpace=123
            // Size=456
            const freeMatch = out.match(/FreeSpace=(\d+)/);
            const sizeMatch = out.match(/Size=(\d+)/);

            if (freeMatch && sizeMatch) {
              const free = parseInt(freeMatch[1]);
              const size = parseInt(sizeMatch[1]);
              const used = size - free;
              const percentage = ((used / size) * 100).toFixed(2);
              const freeGB = (free / (1024 * 1024 * 1024)).toFixed(0); // Using 0 decimals for clean look like "20GB"

              resolve({ percentage, text: `${freeGB}GB Free Space` });
              return;
            }
            resolve({ percentage: "0", text: "Unknown" });
          });
        } else {
          resolve({ percentage: "0", text: "No C:" });
        }
      });
    } else {
      exec("df -h --output=size,avail,pcent / | tail -1", (error, stdout) => {
        if (error) {
          resolve({ percentage: "0", text: "Error" });
        } else {
          // stdout e.g.: " 40G   20G   50%"
          const parts = stdout.trim().split(/\s+/);
          if (parts.length >= 3) {
            const size = parts[0];
            const avail = parts[1];
            const pcent = parts[2].replace("%", "");
            resolve({ percentage: pcent, text: `${avail} Free Space` });
          } else {
            resolve({ percentage: "0", text: "Unknown" });
          }
        }
      });
    }
  });
}


export async function GET(req: Request) {
  try {
    const ram = getRAMUsage();
    const [cpuUsage, storage] = await Promise.all([getCPUUsage(), getStorageUsage()]);
    const [rows] = await db.query<RowDataPacket[]>(`
          SELECT 
              v.voucher_count,
              IFNULL(v.v_earnings, 0) AS v_earnings,
              IFNULL(c.c_earnings, 0) AS c_earnings,
              (IFNULL(v.v_earnings, 0) + IFNULL(c.c_earnings, 0)) AS sales,
              (SELECT COUNT(id) FROM vouchers WHERE used = 1) AS used_count,
              (SELECT COUNT(id) FROM rates) AS rate_count,
              (SELECT COUNT(id) FROM clients) AS client_count
          FROM 
              (SELECT COUNT(id) AS voucher_count, SUM(price) AS v_earnings FROM vouchers) v,
              (SELECT SUM(amount) AS c_earnings FROM transactions) c;
        `);


    return Response.json({
      ramUsage: ram.percentage,
      ramText: ram.text,
      cpuUsage,
      storageUsage: storage.percentage,
      storageText: storage.text,
      ...rows[0]
    }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json({ msg: "Something went wrong!" }, { status: 500 });
  }
}