const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');
const outputFile = path.join(__dirname, 'full_restore.sql');
const initialSchema = path.join(__dirname, '000_initial_schema.sql');

let fullSql = '';

// Add initial schema
if (fs.existsSync(initialSchema)) {
    console.log('Adding 000_initial_schema.sql');
    fullSql += fs.readFileSync(initialSchema, 'utf8') + '\n\n';
}

// Add migrations
const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

for (const file of files) {
    console.log(`Adding ${file}`);
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    fullSql += `-- MIGRATION: ${file}\n${content}\n\n`;
}

fs.writeFileSync(outputFile, fullSql);
console.log(`Created ${outputFile}`);
