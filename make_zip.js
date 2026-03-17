import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addFolderToZip(zip, sourceFolder, zipRoot) {
    if (!fs.existsSync(sourceFolder)) {
        console.log('Pasta não encontrada, pulando:', sourceFolder);
        return;
    }
    const files = fs.readdirSync(sourceFolder);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git') continue;
        const fullPath = path.join(sourceFolder, file);
        const stat = fs.statSync(fullPath);
        const zipEntryPath = zipRoot ? `${zipRoot}/${file}` : file;
        if (stat.isDirectory()) {
            addFolderToZip(zip, fullPath, zipEntryPath);
        } else {
            const content = fs.readFileSync(fullPath);
            zip.addFile(zipEntryPath, content);
        }
    }
}

try {
    console.log("Criando ZIP unificado CRM-Final.zip...");
    const zip = new AdmZip();

    // discloud.config e package.json na RAIZ
    zip.addFile('discloud.config', fs.readFileSync('./discloud.config'));
    zip.addFile('package.json', fs.readFileSync('./package.json'));

    // backend/src (sem node_modules)
    addFolderToZip(zip, './backend/src', 'backend/src');
    zip.addFile('backend/package.json', fs.readFileSync('./backend/package.json'));
    zip.addFile('backend/.env', fs.readFileSync('./backend/.env'));

    // frontend/dist (build estático pronto)
    addFolderToZip(zip, './frontend/dist', 'frontend/dist');

    zip.writeZip('./CRM-Final.zip');

    console.log('\n✅ CRM-Final.zip criado! Verificando root do ZIP:');
    const checkZip = new AdmZip('./CRM-Final.zip');
    checkZip.getEntries().forEach(e => {
        if (!e.entryName.includes('/')) console.log(' -', e.entryName);
    });
    console.log('\nDone!');
} catch(e) {
    console.error("Erro:", e.message);
}
