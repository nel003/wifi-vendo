import db from "@/lib/database";
import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const info = await getDeviceInfoFromIp(ip);
        // console.log(mac, ip);
        if (!info.mac || info.mac.trim() === "" || !ip) {
            return new Response(null, {status: 302, headers: {Location: '/'}});
        }
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [info.mac]);

        if (rows.length < 1) {
            return new Response(null, {status: 302, headers: {Location: '/'}});
        }

        if (rows[0].expire_on != null && new Date(rows[0].expire_on) <= new Date(Date.now())) {
            return new Response(null, {status: 302, headers: {Location: '/'}});
        }
        
        return new Response(null, {status: 204})
    } catch (error) {
        console.log(error);
        return new Response(null, {status: 302, headers: {Location: '/'}});
    }
}