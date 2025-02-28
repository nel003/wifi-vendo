import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import db from "@/lib/database";
import {  RowDataPacket } from "mysql2";
import { execSync } from "child_process";
import moment from "moment";

export async function GET(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const info = await getDeviceInfoFromIp(ip);
        // console.log(mac, ip);
        if (!info.mac || info.mac.trim() === "" || !ip) {
            return new Response('No MAC address found', { status: 404 });
        }
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ? AND expire_on >= NOW();', [info.mac]);

        if (rows.length < 1) {
            return Response.json({msg: "Not enough time!"}, { status: 500 });
        }
        
        if (process.env.PROD === 'true') {
            const expiryDate = moment(rows[0].expire_on);
            const timeout = expiryDate.diff(moment(), 'seconds');
            execSync(`ipset add allowed_macs ${info.mac} timeout ${timeout >= 2147483 ? 2147483 : timeout} -exist`);
        }

        return Response.json({msg: 'success', ...rows[0]}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}
