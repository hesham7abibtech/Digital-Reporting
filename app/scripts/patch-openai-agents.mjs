import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const mjsPath = path.join(projectRoot, 'node_modules', '@openai', 'agents-core', 'dist', 'tracing', 'provider.mjs');
const jsPath = path.join(projectRoot, 'node_modules', '@openai', 'agents-core', 'dist', 'tracing', 'provider.js');

const targetStr = "if (typeof process !== 'undefined' && typeof process.on === 'function')";
const replacementStr = "if (typeof process !== 'undefined' && !process.env?.NEXT_RUNTIME && typeof process.on === 'function')";

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[Patch OpenAI Agents]: File not found: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(replacementStr)) {
      console.log(`[Patch OpenAI Agents]: Already patched: ${path.basename(filePath)}`);
      return;
    }

    if (!content.includes(targetStr)) {
      console.warn(`[Patch OpenAI Agents]: Target pattern not found in ${path.basename(filePath)}`);
      return;
    }

    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[Patch OpenAI Agents]: Successfully patched: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`[Patch OpenAI Agents]: Error patching ${path.basename(filePath)}:`, error);
  }
}

console.log('[Patch OpenAI Agents]: Starting patch process...');
patchFile(mjsPath);
patchFile(jsPath);
console.log('[Patch OpenAI Agents]: Finished.');
