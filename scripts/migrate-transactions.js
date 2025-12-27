const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
        database: process.env.DB_NAME || 'wifi',
    });

    try {
        console.log('Connected to database.');

        // Check if column exists
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM transactions LIKE 'created_at';
        `);

        if (columns.length === 0) {
            console.log('Adding created_at column...');
            await connection.execute(`
                ALTER TABLE transactions
                ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            `);
            console.log('Column added.');
        } else {
            console.log('Column created_at already exists.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
