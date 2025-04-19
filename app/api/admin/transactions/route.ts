import db from "@/lib/database";
import handler from "@/app/api/_middleware";
import {  RowDataPacket } from "mysql2";

export const GET = handler(async () => {
    try {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM transactions ORDER BY id DESC;');
        console.log(rows);
        return Response.json(rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
})

export const DELETE = handler(async (req?: Request) => {
    try {
        await db.query("DELETE FROM transactions");
        return Response.json({msg: "success"}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
})