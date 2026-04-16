const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix broken logo path in sidebar
content = content.split('src="/modon_logo.png"').join('src="/logos/modon_logo.png"');

// 2. Fix button contrast (search bar button)
// We look for background: 'var(--teal)' followed by color: 'var(--text-primary)'
const contrastFix = /background:\s*'var\(--teal\)',\s*color:\s*'var\(--text-primary\)'/g;
content = content.replace(contrastFix, "background: 'var(--teal)', color: 'var(--cotton)'");

// 3. Fix other low-contrast buttons that might use var(--teal) and var(--text-primary)
// Even if they aren't exactly on sequential lines (though they usually are in this project)
// I'll also check for color: 'white' or color: 'var(--cotton)' and ensure it's used with var(--teal)

// 4. Adjust sidebar logo alignment and size
content = content.replace(
  /width: 32,\s*filter:\s*'invert\(1\)\s*brightness\(2\)'/g,
  "width: 36, filter: 'invert(1) brightness(2.5)', transition: 'all 300ms'"
);

// 5. Enhance the Identity & Branding section headers contrast
content = content.replace(
  /color:\s*'var\(--text-muted\)',\s*textTransform:\s*'uppercase',\s*letterSpacing:\s*'0\.1em'/g,
  "color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 900"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Applied Visual Polish to AdminDashboardPage!");
