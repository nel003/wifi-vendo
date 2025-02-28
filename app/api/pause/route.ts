import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import db from "@/lib/database";
import {  RowDataPacket } from "mysql2";
import { execSync } from "child_process";
import moment from "moment-timezone";

export async function GET(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const info = await getDeviceInfoFromIp(ip);
        // console.log(mac, ip);
        if (!info.mac || info.mac.trim() === "" || !ip) {
            return new Response('No MAC address found', { status: 404 });
        }
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ? AND expire_on >= NOW();', [info.mac]);

        const lastPauseAttempt = moment.tz(rows[0].paused_on, "Asia/Manila");
        const today = moment.tz("Asia/Manila").startOf('day');

        if (rows[0].paused) {
            return Response.json({ msg: "Already paused" }, { status: 400 });
        }

        if (!rows[0].can_pause) {
            return Response.json({ msg: "Voucher doesn't support pause!" }, { status: 400 });
        }
        if (lastPauseAttempt.isSame(today, 'day') && rows[0].pause_attempts >= 5) {
            return Response.json({ msg: "Too many pause attempts, try again tomorrow!" }, { status: 400 });
        }
        
        if (!lastPauseAttempt.isSame(today, 'day')) {
            await db.query("UPDATE clients SET pause_attempts = 0 WHERE mac = ?;", [info.mac]);
        }

        await db.query("UPDATE clients SET paused = 1, pause_attempts = pause_attempts + 1, paused_on = NOW() WHERE mac = ?;", [info.mac]);

        if (process.env.PROD === 'true') {
            execSync(`ipset del allowed_macs ${info.mac}`);
        }

        const [final] = await db.execute<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [info.mac]);
        const expiryDate = moment.tz(final[0].expire_on, "Asia/Manila");
        const pausedOn = moment.tz(final[0].paused_on, "Asia/Manila");
        const now = moment.tz(moment.now(), "Asia/Manila");
        let timeout;
        if (final[0].paused) {
            const added = expiryDate.add(now.diff(pausedOn, 'seconds'), 'seconds')
            timeout = added.diff(now, 'seconds')
        } else {
            timeout = expiryDate.diff(moment(), 'seconds');
        }
        return Response.json({msg: 'success', user: {...final[0], timeout}}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}
