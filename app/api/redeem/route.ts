import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import db from "@/lib/database";
import { execSync } from "child_process";
import { RowDataPacket } from "mysql2";
import moment from "moment-timezone";

export async function POST(req: Request) {
    const conn = await db.getConnection();

    try {
        const { voucher } = await req.json();
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const info = await getDeviceInfoFromIp(ip);

        if (!info.mac || info.mac.trim() === "" || !ip) {
            return new Response('No MAC address found', { status: 404 });
        }

        await conn.beginTransaction();

        const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [info.mac]);
        const lastAttempt = moment.tz(rows[0].last_attempt, "Asia/Manila");
        const today = moment.tz("Asia/Manila").startOf('day');

        if (lastAttempt.isSame(today, 'day') && rows[0].attempts >= 5) {
            return Response.json({ msg: "Too many attempts, try again tomorrow!" }, { status: 400 });
        }

        const [vouch] = await db.execute<RowDataPacket[]>('SELECT * FROM vouchers WHERE voucher = ? AND used = 0;', [voucher]);
        if (vouch.length == 0) {
            await conn.execute("UPDATE clients SET attempts = attempts + 1, last_attempt = NOW() WHERE mac = ?;", [info.mac]);
            return Response.json({ msg: "Voucher not found or Expired" }, { status: 404 });
        }

        if (!lastAttempt.isSame(today, 'day')) {
            await conn.execute("UPDATE clients SET attempts = 0, last_attempt = NOW() WHERE mac = ?;", [info.mac]);
        }

        await conn.execute(`
            UPDATE clients
            SET expire_on = IF(expire_on > NOW(), DATE_ADD(expire_on, INTERVAL ? MINUTE), DATE_ADD(NOW(), INTERVAL ? MINUTE))
            WHERE mac = ?`, [vouch[0].time, vouch[0].time, info.mac]);

        await conn.execute('UPDATE vouchers SET used = 1 WHERE voucher = ?;', [voucher]);
        await conn.commit();

        const [final] = await db.execute<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [info.mac]);

        const expiryDate = moment(final[0].expire_on);
        const timeout = expiryDate.diff(moment(), 'seconds');
        
        execSync(`ipset add allowed_macs ${info.mac} timeout ${timeout} -exist`);

        return Response.json({ msg: 'success', user: { ...final[0], timeout } }, { status: 200 });
    } catch (error) {
        console.log(error);
        await conn.rollback();
        return Response.json({ msg: "Something went wrong!" }, { status: 500 });
    } finally {
        conn.release();
    }
}
