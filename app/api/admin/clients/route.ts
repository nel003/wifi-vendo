import db from "@/lib/database";
import handler from "@/app/api/_middleware";
import { execSync } from "child_process";
import {  RowDataPacket } from "mysql2";
import moment from "moment";
import { activeLease } from "@/utils/activeLeases";

export const GET = handler(async (req: Request | undefined) => {
    try {
        const active = await activeLease();
        const url = new URL(req?.url || "");
        const filter = url.searchParams.get("filter");

        const [rows] = await db.query<RowDataPacket[]>(`SELECT * FROM clients WHERE mac LIKE '%${filter}%' OR device LIKE '%${filter}%' OR label LIKE '%${filter}%';`);
        
        const newClients = rows.map(c => {
            return {...c, active: active.includes(c.mac)};
        });

        return Response.json(newClients, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
});

export const PUT = handler(async (req?: Request) => {
    try {
        const { id, mac, label, expiry } = await req?.json();
        if (!id || !mac || !label || !expiry) {
            return Response.json({msg: "All fields are required"}, { status: 400 });
        }

        const formattedDate = new Date(expiry).toLocaleDateString("en-CA", {year: "numeric", month: "2-digit", day: "2-digit"}) + " " + new Date().toLocaleTimeString("en-CA", {hour12: false});

        await db.query<RowDataPacket[]>('UPDATE clients SET paused = 0, can_pause = 0, label = ?, expire_on = ? WHERE id = ?;', [label, formattedDate, id]);

        if (process.env.PROD === 'true') {
            if (new Date(formattedDate) <= new Date(Date.now())) {
                execSync(`ipset del allowed_macs ${mac}`);
            } else {
                const [final] = await db.execute<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ?;', [mac]);
                const expiryDate = moment(final[0].expire_on);
                const timeout = expiryDate.diff(moment(), 'seconds');
                execSync(`ipset add allowed_macs ${mac} timeout ${timeout >= 2147483 ? 2147483 : timeout} -exist`);
            }
        }
        
        return Response.json({msg: "success"}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
});

// export async function POST(req: Request) {
//     try {
//         const { name, price, time } = await req.json();
//         if (!name || !price || !time) {
//             return Response.json({msg: "All fields are required"}, { status: 400 });
//         }

//         await db.query<RowDataPacket[]>('INSERT INTO rates(name, price, time) values(?, ?, ?);', [name, price, time]);
//         return Response.json({msg: "success"}, { status: 200 });
//     } catch (error) {
//         console.log(error);
//         return Response.json({msg: "Something went wrong!"}, { status: 500 });
//     }
// }