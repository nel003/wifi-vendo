import db from "@/lib/database";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
    try {
        const { refreshToken } = await req.json();

        if (refreshToken) {
            await db.query("UPDATE users SET refresh_token = NULL WHERE refresh_token = ?", [refreshToken]);
        }

        return Response.json({ msg: "Logged out" }, { status: 200 });
    } catch (error) {
        return Response.json({ msg: "Error logging out" }, { status: 500 });
    }
}
