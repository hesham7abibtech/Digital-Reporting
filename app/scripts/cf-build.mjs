/**
 * Cloudflare Pages Build Wrapper
 * 
 * Problem: @cloudflare/next-on-pages uses "shellac" which spawns `bash` from PATH.
 * On this machine, PATH resolves bash to C:\Windows\System32\bash.exe (WSL),
 * which opens a dead WSL terminal window.
 * 
 * Solution: Prepend Git's bin directory to PATH so its native MinGW bash.exe
 * is found BEFORE WSL's bash.exe. Also set SHELL explicitly.
 */
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Find Git's bash directory (native MinGW bash, NOT WSL)
const gitBinDirs = [
  'C:\\Program Files\\Git\\bin',
  'C:\\Program Files (x86)\\Git\\bin',
];

const gitBinDir = gitBinDirs.find(p => existsSync(join(p, 'bash.exe')));

if (!gitBinDir) {
  console.error('❌ Git bash not found. Install Git for Windows.');
  process.exit(1);
}

const gitBash = join(gitBinDir, 'bash.exe');

// Prepend Git's bin to PATH so bash resolves to Git's bash, NOT WSL
const originalPath = process.env.PATH || process.env.Path || '';
const newPath = gitBinDir + ';' + originalPath;

console.log(`🔧 Git bash: ${gitBash}`);
console.log(`🔧 PATH prepended with: ${gitBinDir}`);
console.log('📦 Starting @cloudflare/next-on-pages build...\n');

const buildEnv = {
  ...process.env,
  SHELL: gitBash,
  PATH: newPath,
  Path: newPath,
};

try {
  execSync('npx @cloudflare/next-on-pages', {
    stdio: 'inherit',
    cwd: root,
    env: buildEnv,
  });
  console.log('\n✅ Cloudflare Pages build complete.');
} catch (err) {
  console.error('\n❌ Build failed.');
  process.exit(1);
}
