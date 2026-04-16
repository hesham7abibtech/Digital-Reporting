const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'components', 'admin');
const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
    const fullPath = path.join(directoryPath, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Modals Overlay
    content = content.replace(/background: 'rgba\(5,\s*5,\s*10,\s*0\.9\)'/g, "background: 'rgba(0, 30, 36, 0.4)', backdropFilter: 'blur(8px)'");
    content = content.replace(/background: 'rgba\(10,\s*18,\s*32,\s*0\.98\)'/g, "background: 'rgba(0, 30, 36, 0.4)', backdropFilter: 'blur(8px)'");
    
    // 2. Modals Container (Surface) - Making it light mode (var(--cotton) or white)
    content = content.replace(/background: '#0a1220'/gi, "background: 'var(--cotton)'");
    content = content.replace(/background: '#0a0a0f'/gi, "background: 'var(--cotton)'");
    content = content.replace(/background: '#05050a'/gi, "background: 'var(--cotton)'");
    
    // 3. Inputs & Card Backgrounds (Section BG)
    content = content.replace(/background: 'rgba\(255,\s*255,\s*255,\s*0\.02\)'/g, "background: 'var(--section-bg)'");
    content = content.replace(/background: 'rgba\(255,\s*255,\s*255,\s*0\.03\)'/g, "background: 'var(--section-bg)'");
    content = content.replace(/background: 'rgba\(255,\s*255,\s*255,\s*0\.05\)'/g, "background: 'var(--section-bg)'");
    content = content.replace(/background: 'rgba\(255,\s*255,\s*255,\s*0\.06\)'/g, "background: 'var(--card-haze)'");
    content = content.replace(/background: 'rgba\(255,\s*255,\s*255,\s*0\.08\)'/g, "background: 'var(--card-haze)'");
    
    // 4. Borders
    content = content.replace(/border(Bottom|Top|Left|Right)?: '1px solid rgba\(255,\s*255,\s*255,\s*0\.[0123]\d*\)'/g, "border$1: '1px solid var(--border)'");
    
    // 5. Texts (General)
    content = content.replace(/color: 'white'/g, "color: 'var(--text-primary)'");
    content = content.replace(/color: '#ffffff'/g, "color: 'var(--text-primary)'");
    content = content.replace(/color: 'rgba\(255,\s*255,\s*255,\s*0\.[789]\)'/g, "color: 'var(--text-secondary)'");
    content = content.replace(/color: 'rgba\(255,\s*255,\s*255,\s*0\.[456]\)'/g, "color: 'var(--text-muted)'");
    content = content.replace(/color: 'rgba\(255,\s*255,\s*255,\s*0\.[123]\)'/g, "color: 'var(--text-dim)'");
    
    // 6. Action Buttons and Golden Accents to Teal
    content = content.replace(/#D4AF37/gi, "var(--teal)");
    content = content.replace(/rgba\(212,\s*175,\s*55,\s*0\.1\)/g, "var(--secondary)");
    content = content.replace(/rgba\(212,\s*175,\s*55,\s*0\.2\)/g, "var(--border)");
    
    // 7. Fix the "ADD" buttons and "Commit Changes"
    // Usually these are structured as dark text on Gold/Light
    content = content.replace(/color: '#0a0a0f'/gi, "color: '#ffffff'");
    content = content.replace(/color: '#0a1220'/gi, "color: '#ffffff'");
    
    // Specific Dismiss Buttons
    content = content.replace(/background: 'rgba\(255,255,255,0\.02\)'/g, "background: 'var(--section-bg)'");

    // Close X icons
    content = content.replace(/color: 'rgba\(255,\s*255,\s*255,\s*0\.5\)'/g, "color: 'var(--text-muted)'");
    
    if (content !== fs.readFileSync(fullPath, 'utf8')) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Smart updated ${file}`);
    }
});

console.log('Elite Modals Script Extracted.');
