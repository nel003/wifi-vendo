export async function GET(req: Request) {
    const ref = req.headers.get("Referrer") || "";
    const redirectUrl = process.env.MAIN_URL ? `${process.env.MAIN_URL}?from=${encodeURIComponent(ref)}` : "/";

    return new Response(null, { status: 302, headers: { Location: redirectUrl } });
}
