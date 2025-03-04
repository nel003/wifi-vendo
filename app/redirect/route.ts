
export async function GET(req: Request) {
    const ref = req.headers.get("Referrer");
    return new Response(null, {status: 302, headers: {Location: process.env.MAIN_URL+`?from=${ref}` || ""}});
}