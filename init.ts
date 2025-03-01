import {config} from 'dotenv';
config({path: ".env.local"})
import mysql,{ RowDataPacket } from "mysql2/promise";
import { execSync } from "child_process";
import moment from "moment";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

async function init() {
    try {
       const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM clients WHERE expire_on >= NOW();');
       rows.forEach(async (row) => {
        const expiryDate = moment(rows[0].expire_on);
        if(!row.paused) {
            const timeout = expiryDate.diff(moment(), 'seconds');
            console.log(timeout >= 2147483 ? 2147483 : timeout)
            execSync(`ipset add allowed_macs ${row.mac} timeout ${timeout >= 2147483 ? 2147483 : timeout} -exist`);
        }
       });
    console.log(rows);
    } catch (error) {
        console.error(error);
    }

}

init();