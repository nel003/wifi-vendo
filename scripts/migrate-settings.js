const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('DB Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    hasPassword: !!process.env.DB_PASSWORD
});

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
        database: process.env.DB_NAME || 'wifi',
    });

    try {
        console.log('Connected to database.');

        // Create table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                \`key\` VARCHAR(50) PRIMARY KEY,
                \`value\` TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('Settings table created.');

        // Helper to insert if not exists
        const insertSetting = async (key, value) => {
            await connection.execute(
                'INSERT IGNORE INTO settings (`key`, `value`) VALUES (?, ?)',
                [key, value]
            );
        };

        // Seed default values from env or defaults
        await insertSetting('app_name', process.env.NEXT_PUBLIC_APP_NAME || 'WiFi Vendo');
        await insertSetting('app_version', process.env.NEXT_PUBLIC_VERSION || '2.0');
        await insertSetting('has_coinslot', process.env.NEXT_PUBLIC_HAS_COINSLOT || 'true');

        console.log('Seed data inserted.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
