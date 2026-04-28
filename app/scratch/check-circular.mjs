import fs from 'fs';
import path from 'path';

const baseDir = 'e:/Cooding/DigitalReporting Backup/Digital_Reporting/app/src';
const visited = new Set();
const stack = [];

function findCircular(file) {
  if (stack.includes(file)) {
    console.log('CIRCULAR DEPENDENCY FOUND:', stack.slice(stack.indexOf(file)).join(' -> '), '->', file);
    return;
  }
  if (visited.has(file)) return;

  visited.add(file);
  stack.push(file);

  try {
    const content = fs.readFileSync(file, 'utf-8');
    const importRegex = /import\s+.*from\s+['"](.+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      let importPath = match[1];
      if (importPath.startsWith('@/')) {
        importPath = importPath.replace('@/', baseDir + '/');
      } else if (importPath.startsWith('.')) {
        importPath = path.resolve(path.dirname(file), importPath);
      } else {
        continue; // skip node_modules
      }

      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      let found = false;
      for (const ext of extensions) {
        if (fs.existsSync(importPath + ext)) {
          findCircular(importPath + ext);
          found = true;
          break;
        } else if (fs.existsSync(path.join(importPath, 'index' + ext))) {
          findCircular(path.join(importPath, 'index' + ext));
          found = true;
          break;
        }
      }
    }
  } catch (e) {}

  stack.pop();
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      findCircular(fullPath);
    }
  }
}

scanDir(baseDir);
console.log('Scan complete.');
