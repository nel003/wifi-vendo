import db from "@/lib/database";
import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
    const ref = req.headers.get("Referrer") || "";
    const redirectUrl = process.env.MAIN_URL ? `${process.env.MAIN_URL}?from=${encodeURIComponent(ref)}` : "/";

    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.replace("::ffff:", "") || undefined;
        const info = await getDeviceInfoFromIp(ip);

        if (!info?.mac || info.mac.trim() === "" || !ip) {
            return new Response(null, { status: 302, headers: { "Location": redirectUrl } });
        }

        const [rows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM clients WHERE mac = ? AND expire_on >= NOW();', 
            [info.mac]
        );

        if (rows.length < 1 || rows[0].paused || (rows[0].expire_on != null && new Date(rows[0].expire_on) <= new Date())) {
            return new Response(null, { status: 302, headers: { "Location": redirectUrl } });
        }

        return new Response("Success", { status: 200, headers: { "Content-Type": "text/html" } });

    } catch (error) {
        console.error(error);
        return new Response(null, { status: 302, headers: { "Location": redirectUrl } });
    }
}
