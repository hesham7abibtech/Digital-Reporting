const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components', 'admin');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix low-contrast text-dim to text-secondary/primary for accessibility
  content = content.replace(/(style={{[^}]*?color:\s*)'var\(--text-dim\)'/gs, "$1'var(--text-secondary)'");

  // 2. Fix legacy dark mode borders/backgrounds
  content = content.replace(/rgba\(255,255,255,0\.05\)/g, "var(--border)");
  content = content.replace(/rgba\(255,255,255,0\.02\)/g, "var(--section-bg)");
  content = content.replace(/rgba\(255,255,255,0\.1\)/g, "var(--border)");

  // 3. Ensure Teal buttons always have white/cotton text
  content = content.replace(/(background:\s*'var\(--teal\)',[^}]*?color:\s*)'var\(--text-primary\)'/gs, "$1'var(--cotton)'");
  content = content.replace(/(background:\s*'var\(--teal\)',[^}]*?color:\s*)'#003f49'/gs, "$1'var(--cotton)'");

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log("Global Admin Component Polish Complete!");
