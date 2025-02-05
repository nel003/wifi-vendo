import { RowDataPacket } from "mysql2";
import db from "./lib/database";
import { flushRules } from "./lib/flushRules";
import { checkRule } from "./lib/checkRule";
import { execSync } from "child_process";
import { createJob } from "./lib/jobs";

async function init() {
    try {
       const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE expire_on >= NOW();');
       rows.forEach(async (row) => {
            flushRules(row.mac);
            if (!checkRule(row.mac)) {
                execSync(`iptables -I FORWARD -i enx00e0990026d3 -o end0 -m mac --mac-source ${row.mac} -j ACCEPT`);
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