import { RowDataPacket } from "mysql2";
import db from "./lib/database";
import { checkRule } from "./lib/checkRule";
import { execSync } from "child_process";
import { createJob } from "./lib/jobs";

async function init() {
    try {
       const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM clients WHERE expire_on >= NOW();');
       rows.forEach(async (row) => {
            if (!checkRule(row.mac)) {
                execSync(`ipset add allowed_macs ${row.mac}`);
                createJob(row.mac, row.expire_on);
            }
       });
    console.log(rows);
    } catch (error) {
        console.error(error);
    }

    setInterval(() => {}, 1 << 30);
}

init();