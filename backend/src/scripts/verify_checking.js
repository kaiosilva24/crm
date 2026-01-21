
import { db } from '../database/supabase.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function test() {
    console.log('Testing getRecentCheckings...');
    try {
        const logs = await db.getRecentCheckings(10);
        console.log('Success:', logs);
    } catch (error) {
        console.error('Failed:', error);
    }
}

test();
