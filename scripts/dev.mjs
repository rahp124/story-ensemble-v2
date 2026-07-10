import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const children = [];
let shuttingDown = false;

function spawnChild(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  children.push(child);
  child.on('exit', (code) => onChildExit(child, code));
  return child;
}

function onChildExit(child, code) {
  if (shuttingDown) return;
  shuttingDown = true;
  const exitCode = code ?? 0;
  for (const other of children) {
    if (other !== child && other.exitCode === null) {
      other.kill('SIGTERM');
    }
  }
  process.exit(exitCode);
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[dev] starting API shim and Vite...');
spawnChild('node', ['scripts/dev-server.mjs']);
spawnChild('npx', ['vite']);
