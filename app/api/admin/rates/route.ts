import db from "@/lib/database";
import {  RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM rates;');
        console.log(rows);
        return Response.json(rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { name, price, time } = await req.json();
        if (!name || !price || !time) {
            return Response.json({msg: "All fields are required"}, { status: 400 });
        }

        await db.query<RowDataPacket[]>('INSERT INTO rates(name, price, time) values(?, ?, ?);', [name, price, time]);
        return Response.json({msg: "success"}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}