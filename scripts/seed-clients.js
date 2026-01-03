const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function seedClients() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'wifi'
    });

    console.log('Connected to database.');

    const clients = [
        { ip: '192.168.0.101', mac: 'AA:BB:CC:DD:EE:01', device: 'iPhone 13', label: 'Admin Phone' },
        { ip: '192.168.0.102', mac: 'AA:BB:CC:DD:EE:02', device: 'Android', label: 'Guest User' },
        { ip: '192.168.0.103', mac: 'AA:BB:CC:DD:EE:03', device: 'Laptop', label: 'Developer PC' },
        { ip: '192.168.0.104', mac: 'AA:BB:CC:DD:EE:04', device: 'Tablet', label: 'Kids Tablet' },
    ];

    try {
        for (const client of clients) {
            await connection.execute(
                `INSERT INTO clients (ip, mac, device, label) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE label = VALUES(label), device = VALUES(device)`,
                [client.ip, client.mac, client.device, client.label]
            );
        }
        console.log(`Seeded ${clients.length} mock clients.`);
    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await connection.end();
    }
}

seedClients();
