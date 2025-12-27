const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SECRET = process.env.SECRET || 'default-secret-key';
const PORT = 3000; // Assuming 3000 based on package.json

// Generate a test token (mimicking admin)
const token = jwt.sign({ username: 'admin', role: 'admin' }, SECRET, { expiresIn: '15m' });
console.log("Generated Token:", token);

async function testApi(endpoint) {
    try {
        const url = `http://localhost:${PORT}${endpoint}`;
        console.log(`Testing ${url}...`);
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Success [${endpoint}]:`, res.status, res.data.length ? `Got ${res.data.length} items` : res.data);
    } catch (error) {
        if (error.response) {
            console.error(`Failed [${endpoint}]:`, error.response.status, error.response.data);
        } else {
            console.error(`Error [${endpoint}]:`, error.message);
        }
    }
}

async function run() {
    await testApi('/api/admin/rates');
    await testApi('/api/admin/vouchers');
}

run();
