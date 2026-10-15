import { spawn } from 'child_process';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('🚀 Starting OmniMind AI Development Servers...');
console.log('   - Backend API: http://localhost:5000');
console.log('   - Frontend App: http://localhost:5173\n');

const backend = spawn(npmCmd, ['--prefix', 'backend', 'run', 'dev'], { stdio: 'inherit' });
const frontend = spawn(npmCmd, ['--prefix', 'frontend', 'run', 'dev'], { stdio: 'inherit' });

const cleanup = () => {
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
