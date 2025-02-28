
export async function GET(req: Request) {
    return new Response(null, {status: 302, headers: {Location: '/'}});
}