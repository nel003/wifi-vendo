process.env.PROD = 'false';

import { getMacFromIp } from "@/utils/getDeviceInfoFromIp";
import db from "@/lib/database";
import {  RowDataPacket } from "mysql2";
import { checkRule } from "@/lib/checkRule";
import { flushRules } from "@/lib/flushRules";
import { execSync } from "child_process";

export async function GET(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const mac = await getMacFromIp(ip);
        console.log(mac, ip);
        if (!mac || !ip) {
            return new Response('No MAC address found', { status: 404 });
        }
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE mac = ?;', [mac]);

        if (rows[0].expire_on != null && new Date(rows[0].expire_on) <= new Date(Date.now())) {
            return Response.json({msg: "Not enough time!"}, { status: 500 });
        }

        if (process.env.PROD === 'true') {
            flushRules(mac);
            if (!checkRule(mac)) {
                execSync(`iptables -I FORWARD -i enx00e0990026d3 -o end0 -m mac --mac-source ${mac} -j ACCEPT`);
            }
        }

        return Response.json({msg: 'success', ...rows[0]}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}
