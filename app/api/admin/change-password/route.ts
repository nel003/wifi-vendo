import { verifyToken } from "@/lib/auth";
import db from "@/lib/database";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
    try {
        const bearer = req.headers.get("Authorization");
        const token = bearer?.split(" ")[1];

        if (!token) {
            return Response.json({ msg: "Unauthorized" }, { status: 401 });
        }

        const payload = verifyToken(token) as any;
        if (!payload) {
            return Response.json({ msg: "Invalid token" }, { status: 401 });
        }

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return Response.json({ msg: "All fields are required" }, { status: 400 });
        }

        const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM users WHERE id = ?", [payload.id]);

        if (rows.length === 0) {
            return Response.json({ msg: "User not found" }, { status: 404 });
        }

        const user = rows[0];
        const match = await bcrypt.compare(oldPassword, user.password);

        if (!match) {
            return Response.json({ msg: "Incorrect old password" }, { status: 400 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, payload.id]);

        return Response.json({ msg: "Password updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Change password error:", error);
        return Response.json({ msg: "Internal server error" }, { status: 500 });
    }
}
