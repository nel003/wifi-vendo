import { NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET() {
    try {
        const [rows] = await pool.query("SELECT `key`, `value` FROM settings");
        const settings: Record<string, string> = {};

        (rows as any[]).forEach((row) => {
            settings[row.key] = row.value;
        });

        // Fallback defaults if DB is empty for some reason
        const appName = settings.app_name || process.env.NEXT_PUBLIC_APP_NAME || "WiFi Vendo";
        const appVersion = settings.app_version || process.env.NEXT_PUBLIC_VERSION || "2.0";
        const hasCoinslot = settings.has_coinslot !== undefined ? settings.has_coinslot === 'true' : (process.env.NEXT_PUBLIC_HAS_COINSLOT === 'true');
        const coinslotTimeout = settings.coinslot_timeout ? parseInt(settings.coinslot_timeout) : parseInt(process.env.TIMEOUT || "120");
        const maxUpload = settings.max_upload ? parseInt(settings.max_upload) : 20;
        const maxDownload = settings.max_download ? parseInt(settings.max_download) : 20;

        return NextResponse.json({
            app_name: appName,
            app_version: appVersion,
            has_coinslot: hasCoinslot,
            coinslot_timeout: coinslotTimeout,
            max_upload: maxUpload,
            max_download: maxDownload
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ msg: "Internal Server Error" }, { status: 500 });
    }
}
