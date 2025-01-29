import db from "@/lib/database";
import {  RowDataPacket } from "mysql2";
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM vouchers;');
        console.log(rows);
        return Response.json(rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { rate } = await req.json();
        if (!rate) {
            return Response.json({msg: "All fields are required"}, { status: 400 });
        }

        const voucher = uuidv4().slice(0, 6);
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM rates WHERE id = ? LIMIT 1;', [rate]);
        if (!rows.length) {
            return Response.json({msg: "Rate not found"}, { status: 400 });
        }
        await db.query('INSERT INTO vouchers(voucher, time) values(?, ?);', [voucher, rows[0].time]);
        return Response.json({msg: "success", voucher}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}