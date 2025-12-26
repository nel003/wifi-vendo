import { generateAccessToken, verifyToken } from "@/lib/auth";
import db from "@/lib/database";
import { RowDataPacket } from "mysql2";

export async function PUT(req: Request) {
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

        const { name, username, email } = await req.json();

        if (!name || !username || !email) {
            return Response.json({ msg: "All fields are required" }, { status: 400 });
        }

        // Check if username is taken by another user
        const [existing] = await db.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE username = ? AND id != ?",
            [username, payload.id]
        );

        if (existing.length > 0) {
            return Response.json({ msg: "Username already taken" }, { status: 400 });
        }

        await db.query(
            "UPDATE users SET name = ?, username = ?, email = ? WHERE id = ?",
            [name, username, email, payload.id]
        );

        // Fetch updated user to return fresh data
        const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM users WHERE id = ?", [payload.id]);
        const user = rows[0];

        // Remove password
        const { password: _, ...userPayload } = user;

        // Generate new token with updated payload
        const check = await verifyToken(token);
        // We technically don't need to issue a new token if the payload doesn't change essential auth claims,
        // but since we store name/username in the token often, let's reissue it or at least return the updated user object.
        // Looking at login route: const { password: _, ...userPayload } = rows[0]; 
        // const accessToken = generateAccessToken(userPayload); 

        // Let's generate a new access token to keep claims up to date
        const newAccessToken = generateAccessToken(userPayload);

        return Response.json({ ...userPayload, token: newAccessToken }, { status: 200 });

    } catch (error) {
        console.error("Update profile error:", error);
        return Response.json({ msg: "Internal server error" }, { status: 500 });
    }
}
