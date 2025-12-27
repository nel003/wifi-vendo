const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
        database: process.env.DB_NAME || 'wifi',
    });

    console.log('Connected to database.');

    try {
        // Check if column exists
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM users LIKE 'refresh_token';
        `);

        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN refresh_token TEXT NULL;
            `);
            console.log('Added refresh_token column to users table.');
        } else {
            console.log('refresh_token column already exists.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
