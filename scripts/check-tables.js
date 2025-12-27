const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
    console.log('Connecting to DB:', process.env.DB_NAME);
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
        database: process.env.DB_NAME || 'wifi',
    });

    try {
        const [rows] = await connection.query('SHOW TABLES');
        console.log('Tables in database:', rows);

        if (rows.length > 0) {
            const [usersColumns] = await connection.query('SHOW COLUMNS FROM users');
            console.log('Columns in users table:', usersColumns.map(c => c.Field));
        }

    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await connection.end();
    }
}

checkTables();
