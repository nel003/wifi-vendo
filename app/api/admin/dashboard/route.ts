import db from "@/lib/database";
import { RowDataPacket } from "mysql2";
import os from "os"
import { exec } from "child_process"

function getRAMUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return ((totalMem - freeMem) / totalMem * 100).toFixed(2);
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

function getStorageUsage() {
  return new Promise((resolve, reject) => {
    exec("df -h --output=pcent / | tail -1", (error, stdout) => {
      if (error) reject("Error getting storage info");
      else resolve(stdout.trim().replace("%", ""));
    });
  });
}


export async function GET(req: Request) {
  try {
    const ramUsage = getRAMUsage();
    const [cpuUsage, storageUsage] = await Promise.all([getCPUUsage(), getStorageUsage()]);
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


    return Response.json({ ramUsage, cpuUsage, storageUsage, ...rows[0] }, { status: 200 });
  } catch (error) {
    console.log(error);
    return Response.json({ msg: "Something went wrong!" }, { status: 500 });
  }
}