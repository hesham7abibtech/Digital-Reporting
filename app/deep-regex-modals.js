const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'components', 'admin');
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    const fullPath = path.join(directoryPath, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Nuke all hardcoded rgba(255,255,255, x) -> they were used exclusively for Dark Mode components
    // White text
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.[789]\d*\)/g, "var(--text-secondary)");
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.[456]\d*\)/g, "var(--text-muted)");
    content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.[123]\d*\)/g, "var(--text-dim)");
    
    // Grey/White borders
    content = content.replace(/1px solid rgba\(255,\s*255,\s*255,\s*0\.0[56789]\)/g, "1px solid var(--border)");
    content = content.replace(/1px solid rgba\(255,\s*255,\s*255,\s*0\.1[0-9]?\)/g, "1px solid var(--border)");
    
    // Backgrounds (Inputs, Cards)
    content = content.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.0[1234]\)['"]/g, "background: 'var(--section-bg)'");
    content = content.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.0[56789]\)['"]/g, "background: 'var(--card-haze)'");
    content = content.replace(/background:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.1[0-9]?\)['"]/g, "background: 'var(--card-haze)'");

    // The dark navy colors used for inputs in light grey models
    content = content.replace(/#c5c4cb/gi, "var(--border)");
    
    if (content !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Deep Regex updated ${file}`);
    }
});

// Now fix the Admin Dashboard Sidebar Logos
const dashboardPath = path.join(__dirname, 'src', 'app', 'admin', 'dashboard', 'page.tsx');
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
// Fix sidebar logos
dashboardContent = dashboardContent.replace(
    /<div style=\{\{ display: 'flex', alignItems: 'center', gap: 12 \}\}>\s*<img src="\/logos\/modon_logo\.png" alt="MODON" style=\{\{ height: 24, objectFit: 'contain', filter: 'brightness\(0\) invert\(1\)', opacity: 0\.9 \}\} \/>\s*<div style=\{\{ width: 1, height: 16, background: 'rgba\(255,255,255,0\.2\)' \}\} \/>\s*<img src="\/logos\/insite_logo\.png" alt="Insite" style=\{\{ height: 24, objectFit: 'contain', filter: 'brightness\(0\) invert\(1\)', opacity: 0\.9 \}\} \/>\s*<\/div>/,
    `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, width: '100%', padding: '0 24px' }}>
                  <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 1 }} />
                  <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
                  <img src="/logos/insite_logo.png" alt="Insite" style={{ height: 18, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 1 }} />
                </div>`
);
fs.writeFileSync(dashboardPath, dashboardContent, 'utf8');

console.log('Complete Re-run finished.');
