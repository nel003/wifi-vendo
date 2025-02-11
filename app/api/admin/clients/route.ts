import { checkRule } from "@/lib/checkRule";
import db from "@/lib/database";
import { flushRules } from "@/lib/flushRules";
import handler from "@/app/api/_middleware";
import { createJob, jobs } from "@/lib/jobs";
import { execSync } from "child_process";
import {  RowDataPacket } from "mysql2";

export const GET = handler(async () => {
    try {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM clients;');
        console.log(rows);
        return Response.json(rows, { status: 200 });
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

        await db.query<RowDataPacket[]>('UPDATE clients SET label = ?, expire_on = ? WHERE id = ?;', [label, formattedDate, id]);

        if (process.env.PROD === 'true') {
            if (new Date(formattedDate) <= new Date(Date.now())) {
                execSync(`ipset del allowed_macs ${mac}`);
                jobs.get(mac || "")?.stop();
            } else {
                if (!checkRule(mac || "")) {
                    execSync(`ipset add allowed_macs ${mac}`);

                    jobs.get(mac || "")?.stop();
                    createJob(mac || "", formattedDate);
                }
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