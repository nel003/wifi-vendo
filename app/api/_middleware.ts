import jwt from "jsonwebtoken";
// Forced recompile update

export default function handler(route: (req?: Request) => Promise<Response>) {
    return async function (req: Request) {
        try {
            const bearer = req.headers.get("Authorization");
            const token = bearer?.split(" ")[1];
            // console.log(bearer, token);
            if (!bearer || !token) {
                return Response.json({ msg: "Invalid or expired token!" }, { status: 401 });
            }
            if (!(await jwt.verify(token, process.env.SECRET || "default-secret-key"))) {
                console.log("Token verification failed (falsy return)");
                return Response.json({ msg: "Invalid or expired token!" }, { status: 401 });
            }
            return await route(req);
        } catch (error: any) {
            console.log("Middleware error:", error.message);
            return Response.json({ msg: "Invalid or expired token! err" }, { status: 401 });
        }
    }
}