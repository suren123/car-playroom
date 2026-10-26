import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const runtime = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const envFile = fileURLToPath(new URL('../.dev.vars', import.meta.url));
const child = spawn(process.execPath, [runtime, 'dev', '--config', 'dist/server/wrangler.json', '--env-file', envFile, '--local', '--persist-to', '.wrangler/state', '--ip', '127.0.0.1', '--port', '5173', '--inspector-port', '0', ...process.argv.slice(2)], {stdio:'inherit'});
process.on('SIGINT',()=>child.kill('SIGINT'));
process.on('SIGTERM',()=>child.kill('SIGTERM'));
child.on('exit',code=>process.exit(code ?? 0));
