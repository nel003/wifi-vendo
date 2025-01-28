import { getMacFromIp } from "@/utils/getMAC";
import db from "@/lib/database";
import {  RowDataPacket } from "mysql2";

export async function GET(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const mac = await getMacFromIp(ip);
        console.log(mac, ip);
        if (!mac || !ip) {
            return new Response('No MAC address found', { status: 404 });
        }

        const query = `
            INSERT IGNORE INTO users (ip, mac)
            VALUES (?, ?)
        `;
        await db.execute(query, [ip, mac]);

        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE mac = ?;', [mac]);
        console.log(rows);
        return Response.json({msg: 'succes', ...rows[0]}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 200 });
    }
}