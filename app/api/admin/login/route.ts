import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "@/lib/database";
import { RowDataPacket } from "mysql2";
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from "@/lib/auth";

export async function GET() {
    try {
        if (!process.env.GET_HASH) {
            return Response.json({ msg: "Oops!" }, { status: 400 });
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
            return Response.json({ msg: "Fields are required!" }, { status: 400 });
        }
        const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM users WHERE username = ?;", [username]);
        if (rows.length < 1) {
            return Response.json({ msg: "Invalid username or password!" }, { status: 400 });
        }

        if (!bcrypt.compareSync(password, rows[0].password)) {
            return Response.json({ msg: "Invalid username or password!" }, { status: 400 });
        }

        // Remove password from payload
        const { password: _, ...userPayload } = rows[0];

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken(userPayload);

        await setRefreshTokenCookie(refreshToken);

        return Response.json({ ...userPayload, token: accessToken }, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({ msg: "Samtingwung!" }, { status: 500 });
    }
}