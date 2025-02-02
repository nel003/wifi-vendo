import jwt from "jsonwebtoken";

export default function handler(route: (req?: Request) => Promise<Response>) {
    return async function(req: Request) {
        try {
            const bearer = req.headers.get("Authorization");
            const token = bearer?.split(" ")[1];
            // console.log(bearer, token);
            if (!bearer || !token) {
                return Response.json({msg: "Invalid or expired token!"}, {status: 300});
            }
            if (!(await jwt.verify(token, process.env.SECRET || ""))) {
                return Response.json({msg: "Invalid or expired token!"}, {status: 300});
            }
            return route(req);
        } catch (error: any) {
            return Response.json({msg: "Invalid or expired token!"}, {status: 300});
        }
    }
}