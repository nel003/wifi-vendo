import { removeRefreshTokenCookie } from "@/lib/auth";

export async function POST() {
    try {
        await removeRefreshTokenCookie();
        return Response.json({ msg: "Logged out" }, { status: 200 });
    } catch (error) {
        return Response.json({ msg: "Error logging out" }, { status: 500 });
    }
}
