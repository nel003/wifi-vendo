import db from "@/lib/database";
import handler from "@/app/api/_middleware";
import {  RowDataPacket } from "mysql2";

export const GET = handler(async () => {
    try {
        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM rates;');
        console.log(rows);
        return Response.json(rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
})

export const POST = handler(async (req?: Request) => {
    try {
        const { name, price, time } = await req?.json();
        if (!name || !price || !time) {
            return Response.json({msg: "All fields are required"}, { status: 400 });
        }

        await db.query<RowDataPacket[]>('INSERT INTO rates(name, price, time) values(?, ?, ?);', [name, price, time]);
        return Response.json({msg: "success"}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
})

export const PUT = handler(async (req?: Request) => {
    try {
        const { id, name, price, time } = await req?.json();
        if (!id || !name || !price || !time) {
            return Response.json({msg: "All fields are required"}, { status: 400 });
        }

        await db.query<RowDataPacket[]>('UPDATE rates SET name = ?, price = ?, time = ? WHERE id = ?;', [name, price, time, id]);
        return Response.json({msg: "success"}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
});

export const DELETE = handler(async (req?: Request) => {
    try {
        const url = new URL(req?.url || "");
        const id = url.searchParams.get("id");
        
        if (!id) {
            return Response.json({msg: "Missing ID"}, { status: 400 });
        }

        await db.query("DELETE FROM rates WHERE id = ?", [id]);
        return Response.json({msg: "success"}, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
})