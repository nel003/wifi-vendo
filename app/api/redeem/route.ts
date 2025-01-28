import { getMacFromIp } from "@/utils/getMAC";
import db from "@/lib/database";
import { createJob, jobs } from "@/lib/jobs";
import { execSync } from "child_process";
import { RowDataPacket } from "mysql2";
import { checkRule } from "@/lib/checkRule";

export async function POST(req: Request) {
    try {
        const { voucher } = await req.json();
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const mac = await getMacFromIp(ip);
        // console.log(mac, ip);
        // console.log(voucher);
        if (!mac || !ip) {
            return new Response('No MAC address found', { status: 404 });
        }

        const [vouch]= await db.query<RowDataPacket[]>('SELECT * FROM vouchers WHERE voucher = ? AND used = 0;', [voucher]);
        if(vouch.length == 0) {
            return Response.json({msg: "Voucher not found or Expired"}, { status: 404 });
        }

        const [rows]= await db.query<RowDataPacket[]>('SELECT * FROM users WHERE mac = ?;', [mac]);
        if(rows[0].expire_on == null || new Date(rows[0].expire_on) < new Date(Date.now())) {
            const query = `
                UPDATE users
                SET expire_on = DATE_ADD(NOW(), INTERVAL ? MINUTE)
                WHERE mac = ?
            `;
            await db.execute(query, [vouch[0].time, mac]);
        } else {
            const query = `
                UPDATE users
                SET expire_on = DATE_ADD(expire_on, INTERVAL ? MINUTE)
                WHERE mac = ?
            `;
            await db.execute(query, [vouch[0].time, mac]);
        }

        await db.query('UPDATE vouchers SET used = 1 WHERE voucher = ?;', [voucher]);
        const [final]= await db.query<RowDataPacket[]>('SELECT * FROM users WHERE mac = ?;', [mac]);
        jobs.get(mac)?.stop();
        createJob(mac, final[0].expire_on);

        if (checkRule(mac)) {
            execSync(`#iptables -I FORWARD -i enx00e0990026d3 -o end0 -m mac --mac-source ${mac} -j ACCEPT`);
        }

        return Response.json({msg: 'succes', user: {...final[0]}}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}