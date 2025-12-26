import { NextResponse } from "next/server";

export async function GET() {
    try {
        const name = process.env.NEXT_PUBLIC_APP_NAME || "WiFi Vendo";
        return NextResponse.json({ name }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ msg: "Internal Server Error" }, { status: 500 });
    }
}
