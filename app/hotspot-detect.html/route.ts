import db from "@/lib/database";
import { getDeviceInfoFromIp } from "@/utils/getDeviceInfoFromIp";
import { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.replace("::ffff:", "").split(',').shift();
        const info = await getDeviceInfoFromIp(ip);
        
        if (!info.mac || info.mac.trim() === "" || !ip) {
            return new Response(`
            <html>
              <head>
                <meta http-equiv="refresh" content="0; url=${process.env.MAIN_URL || ""}" />
              </head>
              <body>
                <p>Redirecting...</p>
              </body>
            </html>`, {
                status: 200,
                headers: { "Content-Type": "text/html" }
            });
        }

        const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM clients WHERE mac = ? AND expire_on >= NOW();', [info.mac]);

        if (rows.length < 1 || rows[0].paused || (rows[0].expire_on != null && new Date(rows[0].expire_on) <= new Date())) {
            return new Response(`
            <html>
              <head>
                <meta http-equiv="refresh" content="0; url=${process.env.MAIN_URL || ""}" />
              </head>
              <body>
                <p>Redirecting...</p>
              </body>
            </html>`, {
                status: 200,
                headers: { "Content-Type": "text/html" }
            });
        }

        return new Response("<html><body>Success</body></html>", {
            status: 200,
            headers: { "Content-Type": "text/html" }
        });

    } catch (error) {
        console.log(error);
        return new Response(`
        <html>
          <head>
            <meta http-equiv="refresh" content="0; url=${process.env.MAIN_URL || ""}" />
          </head>
          <body>
            <p>Redirecting...</p>
          </body>
        </html>`, {
            status: 200,
            headers: { "Content-Type": "text/html" }
        });
    }
}
