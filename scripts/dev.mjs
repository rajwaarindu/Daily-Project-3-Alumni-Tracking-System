import { spawn } from 'node:child_process';
import path from 'node:path';

const viteBin = path.resolve('node_modules', 'vite', 'bin', 'vite.js');

const processes = [];

const startProcess = (command, args, label) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      return;
    }

    if (code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }

    for (const processInstance of processes) {
      if (processInstance.pid && processInstance.pid !== child.pid) {
        processInstance.kill();
      }
    }

    process.exit(code ?? 0);
  });

  processes.push(child);
  return child;
};

const apiProcess = startProcess(process.execPath, ['server/auth-server.mjs'], 'api');
const frontendProcess = startProcess(process.execPath, [viteBin], 'vite');

const shutdown = () => {
  for (const processInstance of processes) {
    processInstance.kill('SIGINT');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('exit', () => {
  apiProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
});