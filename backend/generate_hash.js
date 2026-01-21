import bcrypt from 'bcryptjs';
import fs from 'fs';

async function hash() {
    const pass = '123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass, salt);
    fs.writeFileSync('hash.txt', hash);
}

hash();
