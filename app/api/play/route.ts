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
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?', [info.mac]);

        const pausedOn = moment.tz(rows[0].paused_on, "Asia/Manila");
        const now = moment.tz(moment.now(), "Asia/Manila");

        const diff = now.diff(pausedOn, 'seconds');

        if (!rows[0].paused) {
            return Response.json({msg: "Already played!"}, { status: 400 });
        }
        if (diff < 1) {
            return Response.json({msg: "No more time!"}, { status: 400 });
        }

        await db.query("UPDATE clients SET paused = 0, expire_on = DATE_ADD(expire_on, INTERVAL TIMESTAMPDIFF(SECOND, paused_on, NOW()) SECOND) WHERE mac = ?;", [info.mac]);
        const [final] = await db.execute<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [info.mac]);

        if (process.env.PROD === 'true') {
            const expiryDate = moment(final[0].expire_on);
            const timeout = expiryDate.diff(moment(), 'seconds');
            execSync(`ipset add allowed_macs ${info.mac} timeout ${timeout >= 2147483 ? 2147483 : timeout} -exist`);
        }

        const expiryDate = moment.tz(final[0].expire_on, "Asia/Manila");
        const pausedOnF = moment.tz(final[0].paused_on, "Asia/Manila");
        const nowF = moment.tz(moment.now(), "Asia/Manila");
        let timeout;
        if (final[0].paused) {
            const added = expiryDate.add(now.diff(pausedOnF, 'seconds'), 'seconds')
            timeout = added.diff(nowF, 'seconds')
        } else {
            timeout = expiryDate.diff(moment(), 'seconds');
        }
        return Response.json({msg: 'success', user: {...final[0], timeout}}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}
