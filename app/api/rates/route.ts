import database from "@/lib/database";
import { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const [rows] = await database.query<RowDataPacket[]>('SELECT * FROM rates ORDER BY price ASC;');
        console.log(rows);
        return Response.json(rows, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Something went wrong!"}, { status: 500 });
    }
}