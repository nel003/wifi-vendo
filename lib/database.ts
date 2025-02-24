import mysql, { Pool } from 'mysql2/promise';

let pool: Pool;

declare global {
  var _mysqlPool: Pool | undefined;
}

if (!global._mysqlPool) {
  global._mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

pool = global._mysqlPool;

export default pool;