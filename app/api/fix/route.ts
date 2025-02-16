import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import db from "@/lib/database";
import {  RowDataPacket } from "mysql2";
import { checkRule } from "@/lib/checkRule";
import { flushRules } from "@/lib/flushRules";
import { execSync } from "child_process";
import { createJob, jobs } from "@/lib/jobs";

export async function GET(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const info = await getDeviceInfoFromIp(ip);
        // console.log(mac, ip);
        if (!info.mac || info.mac.trim() === "" || !ip) {
            return new Response('No MAC address found', { status: 404 });
        }
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [info.mac]);

        if (rows[0].expire_on != null && new Date(rows[0].expire_on) <= new Date(Date.now())) {
            return Response.json({msg: "Not enough time!"}, { status: 500 });
        }
        
        if (process.env.PROD === 'true') {
            if (!checkRule(info.mac || "")) {
                execSync(`ipset add allowed_macs ${info.mac}`);
                
                jobs.get(info.mac || "")?.stop();
                createJob(info.mac || "", rows[0].expire_on);
            }
        }

        return Response.json({msg: 'success', ...rows[0]}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}
