import { generateAccessToken, getRefreshTokenFromCookie, verifyToken } from "@/lib/auth";

export async function POST() {
    try {
        const refreshToken = await getRefreshTokenFromCookie();

        if (!refreshToken) {
            return Response.json({ msg: "No refresh token" }, { status: 401 });
        }

        const payload = verifyToken(refreshToken);

        if (!payload) {
            return Response.json({ msg: "Invalid refresh token" }, { status: 401 });
        }

        // In a more strict system, we might check if the user still exists in DB here.
        // For now, we trust the valid signature of the long-lived token.
        // We need to remove 'exp' and 'iat' from the old payload before signing new one
        const { iat, exp, ...userPayload } = payload as any;

        const newAccessToken = generateAccessToken(userPayload);

        return Response.json({ token: newAccessToken, ...userPayload }, { status: 200 });

    } catch (error) {
        console.error("Refresh error:", error);
        return Response.json({ msg: "Internal Server Error" }, { status: 500 });
    }
}
