const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/admin/login';
const USERNAME = 'admin'; // Adjust if needed
const WRONG_PASSWORD = 'wrongpassword';

async function testLockout() {
    console.log('Testing login lockout...');

    // 1. Reset user state first
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
        database: process.env.DB_NAME || 'wifi',
    });

    // Get user ID
    const [users] = await connection.query('SELECT id, username FROM users LIMIT 1');
    if (users.length === 0) {
        console.log('No users found to test.');
        await connection.end();
        return;
    }
    const userId = users[0].id;
    const username = users[0].username;
    console.log(`Testing with user: ${username} (ID: ${userId})`);

    // Reset
    await connection.query('UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = ?', [userId]);

    // 2. Fail 5 times
    for (let i = 1; i <= 5; i++) {
        try {
            await axios.post(API_URL, { username, password: WRONG_PASSWORD });
            console.log(`Attempt ${i}: Unexpected success (Should fail)`);
        } catch (error) {
            if (error.response) {
                console.log(`Attempt ${i}: Failed as expected. Status: ${error.response.status}`);
            } else {
                console.log(`Attempt ${i}: Error ${error.message}`);
            }
        }
    }

    // 3. 6th attempt should be locked
    console.log('Attempt 6 (Should be locked)...');
    try {
        await axios.post(API_URL, { username, password: WRONG_PASSWORD });
        console.log('Attempt 6: Unexpected success (Should be locked)');
    } catch (error) {
        if (error.response) {
            console.log(`Attempt 6: Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            if (error.response.status === 429) {
                console.log('PASS: Account is locked correctly.');
            } else {
                console.log('FAIL: Account not locked.');
            }
        } else {
            console.log(`Attempt 6: Error ${error.message}`);
        }
    }

    // 4. Cleanup (Unlock)
    await connection.query('UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = ?', [userId]);
    console.log('Account unlocked for user convenience.');

    await connection.end();
}

testLockout();
