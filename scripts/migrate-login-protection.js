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
        const [columns] = await connection.query("SHOW COLUMNS FROM users");
        const existingColumns = columns.map(c => c.Field);

        if (!existingColumns.includes('failed_attempts')) {
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN failed_attempts INT DEFAULT 0;
            `);
            console.log('Added failed_attempts column.');
        } else {
            console.log('failed_attempts column already exists.');
        }

        if (!existingColumns.includes('lockout_until')) {
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN lockout_until DATETIME NULL;
            `);
            console.log('Added lockout_until column.');
        } else {
            console.log('lockout_until column already exists.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
