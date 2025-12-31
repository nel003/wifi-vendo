import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "@/lib/database";
import { RowDataPacket } from "mysql2";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";

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

        const user = rows[0];

        // Check for lockout
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            const until = new Date(user.lockout_until);
            return Response.json({ msg: `Account locked until ${until.toLocaleTimeString()}` }, { status: 429 });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            // Increment failed attempts
            const newAttempts = (user.failed_attempts || 0) + 1;
            let lockoutUntil = null;

            if (newAttempts >= 5) {
                // Lock for 15 minutes
                lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
            }

            await db.query("UPDATE users SET failed_attempts = ?, lockout_until = ? WHERE id = ?", [newAttempts, lockoutUntil, user.id]);

            return Response.json({ msg: "Invalid username or password!" }, { status: 400 });
        }

        // Reset failed attempts on success
        if (user.failed_attempts > 0 || user.lockout_until) {
            await db.query("UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = ?", [user.id]);
        }

        // Remove password and refresh_token from payload
        const { password: _, refresh_token: __, failed_attempts, lockout_until, ...userPayload } = user;

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken(userPayload);

        // Store refresh token in database
        await db.query("UPDATE users SET refresh_token = ? WHERE id = ?", [refreshToken, rows[0].id]);

        // Return tokens in body (client will handle storage)
        return Response.json({ ...userPayload, token: accessToken, refreshToken }, { status: 200 });
    } catch (error) {
        console.log(error);
        return Response.json({ msg: "Samtingwung!" }, { status: 500 });
    }
}