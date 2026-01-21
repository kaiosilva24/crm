import fs from 'fs';
try {
    const data = fs.readFileSync('start_log.txt', 'utf16le'); // Read as UTF-16LE
    console.log(data);
} catch (e) {
    if (e.code === 'ERR_INVALID_OPT_VALUE_ENCODING') {
        // Try utf8
        const data = fs.readFileSync('start_log.txt', 'utf8');
        console.log(data);
    } else {
        console.log('Error reading file:', e.message);
    }
}
