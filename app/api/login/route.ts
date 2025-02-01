import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import db from "@/lib/database";
import {  RowDataPacket } from "mysql2";

export async function GET(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const info = await getDeviceInfoFromIp(ip);
        // console.log(mac, ip);
        if (!info || !ip) {
            return new Response('No MAC address found', { status: 404 });
        }

        const query = `
            INSERT INTO users (ip, mac, device)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE ip = VALUES(ip), device = VALUES(device)
        `;
        await db.execute(query, [ip, info.mac, info.deviceName]);

        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE mac = ?;', [info.mac]);
        console.log(rows);
        return Response.json({msg: 'succes', ...rows[0]}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 200 });
    }
}