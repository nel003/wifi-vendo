import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "@/lib/database";
import { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        if (!process.env.GET_HASH) {
            return Response.json({msg: "Oops!"}, {status: 400});
        }
        const hashed = await bcrypt.hashSync(process.env.GET_HASH, 10);
        return new Response(hashed);
    } catch (error) {
        console.log(error)
    }
}

export async function POST(req: Request) {
    const { username, password } = await req.json();
    try {
        if (!username || !password) {
            return Response.json({msg: "Fields are required!"}, {status: 400});
        }
        const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM users WHERE username = ?;", [username]);
        if (rows.length < 1) {
            return Response.json({msg: "Invalid username or password!"}, {status: 400});
        }

        if (!bcrypt.compareSync(password, rows[0].password)) {
            return Response.json({msg: "Invalid username or password!"}, {status: 400});
        }

        const token = await jwt.sign(rows[0], process.env.SECRET || "");

        return Response.json({...rows[0], token}, {status: 200});
    } catch (error) {
        console.log(error);
        return Response.json({msg: "Samtingwung!"}, {status: 500});
    }
}