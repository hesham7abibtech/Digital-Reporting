const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Button Contrast (Multi-line safe)
// This regex looks for background: 'var(--teal)' and then finds the next color: 'var(--text-primary)' within the same style object (roughly 100 chars window)
content = content.replace(/(background:\s*'var\(--teal\)',[^}]*?color:\s*)'var\(--text-primary\)'/gs, "$1'var(--cotton)'");

// 2. Fix Section Labels (Ultra Contrast)
// In Branding / Settings / CMS, labels should be var(--teal) or var(--text-primary) for better contrast against cotton/section-bg
content = content.replace(/(<label[^>]*?style={{[^}]*?color:\s*)'var\(--text-dim\)'/gs, "$1'var(--teal)'");

// 3. Improve Section Headers (Bigger, Bolder)
content = content.replace(/(fontSize:\s*)13(,\s*fontWeight:\s*900,\s*color:\s*'var\(--text-primary\)',\s*textTransform:\s*'uppercase')/g, "$114$2");

// 4. Sidebar Logo Adjustments (Final Polish)
// Make sure it's centered and premium
content = content.replace(/'modon_logo.png'/g, "'logos/modon_logo.png'"); // Redundant fix just in case

// 5. Audit logos/insite_logo.png usage
content = content.replace(/'insite_logo.png'/g, "'logos/insite_logo.png'");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Finalized Admin Portal Visual Excellence!");
