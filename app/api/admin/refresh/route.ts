import { generateAccessToken, verifyToken } from "@/lib/auth";
import db from "@/lib/database";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
    try {
        const { refreshToken } = await req.json();

        if (!refreshToken) {
            return Response.json({ msg: "No refresh token" }, { status: 401 });
        }

        const payload = verifyToken(refreshToken);

        if (!payload) {
            return Response.json({ msg: "Invalid refresh token" }, { status: 401 });
        }

        const { iat, exp, ...userPayload } = payload as any;

        // Verify token against DB
        const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM users WHERE id = ? AND refresh_token = ?", [userPayload.id, refreshToken]);

        if (rows.length === 0) {
            return Response.json({ msg: "Session expired or revoked" }, { status: 401 });
        }

        const newAccessToken = generateAccessToken(userPayload);

        return Response.json({ token: newAccessToken, ...userPayload }, { status: 200 });

    } catch (error) {
        console.error("Refresh error:", error);
        return Response.json({ msg: "Internal Server Error" }, { status: 500 });
    }
}
