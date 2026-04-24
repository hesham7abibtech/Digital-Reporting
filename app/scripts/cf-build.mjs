/**
 * Cloudflare Pages Build Wrapper
 * 
 * Prevents WSL's bash.exe from being invoked by @cloudflare/next-on-pages.
 * On Windows, the Vercel build subprocess looks for 'bash' in PATH, which
 * resolves to WSL's bash.exe and opens a dead terminal window.
 * 
 * This wrapper forces SHELL=cmd.exe before invoking the build.
 */
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Force SHELL to cmd.exe to prevent WSL bash from being invoked
process.env.SHELL = 'cmd.exe';
// Also remove any BASH_ENV that might trigger WSL
delete process.env.BASH_ENV;

console.log('🔧 SHELL forced to cmd.exe (WSL bypass active)');
console.log('📦 Starting @cloudflare/next-on-pages build...\n');

try {
  execSync('npx @cloudflare/next-on-pages', {
    stdio: 'inherit',
    cwd: join(__dirname, '..'),
    env: {
      ...process.env,
      SHELL: 'cmd.exe',
    },
  });
  console.log('\n✅ Cloudflare Pages build complete.');
} catch (err) {
  console.error('\n❌ Build failed.');
  process.exit(1);
}
