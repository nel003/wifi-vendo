import { NextResponse } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/lib/database"; // Use shared connection pool

// Middleware helper (simplified for this route)
async function verifyAdmin() {
    const headersList = await headers();
    const token = headersList.get("authorization")?.split(" ")[1];

    if (!token) return false;

    try {
        jwt.verify(token, process.env.SECRET || "default-secret-key");
        return true;
    } catch (error) {
        return false;
    }
}

export async function POST(req: Request) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { app_name, coinslot_timeout, has_coinslot, max_upload, max_download } = body;

        // Update each setting
        // Note: pool.query is generally preferred over execute for simple queries in mysql2/promise depending on the pool type, 
        // but pool.execute works if prepared statements are supported. 
        // lib/database.ts returns a Pool.
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['app_name', app_name || "", app_name || ""]);
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['coinslot_timeout', String(coinslot_timeout || "120"), String(coinslot_timeout || "120")]);
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['has_coinslot', String(has_coinslot), String(has_coinslot)]);
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['max_upload', String(max_upload || "20"), String(max_upload || "20")]);
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', ['max_download', String(max_download || "20"), String(max_download || "20")]);

        return NextResponse.json({ msg: "Settings updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ msg: "Internal Server Error" }, { status: 500 });
    }
}
