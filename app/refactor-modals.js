const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'components', 'admin');
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    const fullPath = path.join(directoryPath, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // Replacements from Dark to Light Theme Tokens
    let newContent = content
        .replace(/#0a1220/g, 'var(--background)')
        .replace(/#05050a/g, 'var(--surface)')
        .replace(/#D4AF37/g, 'var(--teal)')
        .replace(/rgba\(212, 175, 55, 0.1\)/g, 'var(--secondary)')
        .replace(/rgba\(212, 175, 55, 0.4\)/g, 'var(--border)')
        .replace(/rgba\(255,\s*255,\s*255,\s*0\.0[2-5]\)/g, 'var(--section-bg)')
        .replace(/rgba\(255,\s*255,\s*255,\s*0\.[1-2]\)/g, 'var(--border)')
        .replace(/rgba\(255,\s*255,\s*255,\s*0\.[3-9]\)/g, 'var(--text-secondary)')
        .replace(/color:\s*['"]white['"]/g, "color: 'var(--text-primary)'")
        .replace(/color:\s*['"]#ffffff['"]/g, "color: 'var(--text-primary)'")
        .replace(/rgba\(10,\s*18,\s*32,\s*0\.98\)/g, 'rgba(255, 255, 255, 0.95)')
        .replace(/rgba\(5,\s*5,\s*10,\s*0\.9\)/g, 'rgba(255, 255, 255, 0.8)')
        .replace(/0\s+20px\s+50px\s+rgba\(0,\s*0,\s*0,\s*0\.9\)/g, 'var(--shadow-premium)')
        .replace(/0\s+10px\s+30px\s+rgba\(0,\s*0,\s*0,\s*0\.5\)/g, 'var(--shadow-card)');

    if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});

console.log('Modals Refactoring Complete.');
