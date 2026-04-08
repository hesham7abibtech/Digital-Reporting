import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const versionFilePath = path.join(publicDir, 'version.json');

const versionInfo = {
  version: Date.now().toString(),
  buildTime: new Date().toISOString(),
};

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2));
console.log(`Generated version info: ${versionInfo.version}`);
