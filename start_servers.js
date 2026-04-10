const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando Backend...');
const backendProcess = spawn('npm.cmd', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    detached: true,
    stdio: 'ignore'
});
backendProcess.unref();

console.log('Iniciando Frontend...');
const frontendProcess = spawn('npm.cmd', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    detached: true,
    stdio: 'ignore'
});
frontendProcess.unref();

console.log('Processos iniciados com sucesso! Servidores rodando no fundo.');
process.exit(0);
