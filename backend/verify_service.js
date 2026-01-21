import { findSubscriberByName } from './src/services/manychatService.js';
import dotenv from 'dotenv';
dotenv.config();

// Token from DB/User
const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';

async function run() {
    console.log('Testing service function...');
    const id = await findSubscriberByName('Debug WA', TOKEN);
    console.log('Result ID:', id);
}

run();
