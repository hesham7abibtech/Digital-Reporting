const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Logos
content = content.replace(
  /<img src="\/MODON_INSITE_WHITE\.png" alt="Modon Site" style=\{\{ height: 20, opacity: 0\.9 \}\} \/>/,
  `<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src="/logos/modon_logo.png" alt="MODON" style={{ height: 24, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                  <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
                  <img src="/logos/insite_logo.png" alt="Insite" style={{ height: 24, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
                </div>`
);

// 2. Fix top bar user card
content = content.replace(
  /<div style=\{\{ textAlign: 'right' \}\}>\s*<div style=\{\{ fontSize: 10, color: 'var\(--teal\)', fontWeight: 900, textTransform: 'uppercase' \}\}>\{userProfile\?\.isAdmin \? 'ADMIN' : 'USER'\}<\/div>\s*<\/div>/,
  `<div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 800 }}>{userProfile?.name || 'Administrator'}</div>
                  <div style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 900, textTransform: 'uppercase' }}>{userProfile?.isAdmin ? 'ADMIN' : 'USER'}</div>
                </div>`
);

// 3. Add animated texture to the main dashboard background
// First replace the current div in line 984 (var(--cotton))
content = content.replace(
  /<div style=\{\{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden', background: 'var\(--cotton\)' \}\}>/,
  `<div className="admin-dashboard-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden', background: 'var(--cotton)', backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundPosition: 'center center' }}>`
);

// 4. Transform ALL inline Branding & Reports dark UI
// We have to selectively translate rgba(255,255,255,0.xxx) and #D4AF37 to Light-Teal standards in the lower half of the file.
// We can use a targeted regex replacing on a specific slice of the file.
let brandingStart = content.indexOf(`activeTab === 'branding'`);
let endOfFile = content.length;

if (brandingStart > -1) {
  let brandingSection = content.slice(brandingStart, endOfFile);
  
  // Transform standard patterns
  brandingSection = brandingSection
    .replace(/rgba\(255,\s*255,\s*255,\s*0\.0[2-5]\)/g, 'var(--section-bg)')
    .replace(/rgba\(255,\s*255,\s*255,\s*0\.0[6-9]\)/g, 'var(--border)')
    .replace(/rgba\(255,\s*255,\s*255,\s*0\.[1-2]\)/g, 'var(--border)')
    .replace(/rgba\(255,\s*255,\s*255,\s*0\.[3-9]\)/g, 'var(--text-secondary)')
    .replace(/rgba\(0,\s*0,\s*0,\s*0\.2\)/g, 'var(--section-bg)') // Deep background inputs
    .replace(/['"]white['"]/gi, "'var(--text-primary)'")
    .replace(/['"]#ffffff['"]/gi, "'var(--text-primary)'")
    .replace(/#D4AF37/gi, "var(--teal)")
    .replace(/rgba\(212,\s*175,\s*55,\s*0\.0[3-8]\)/gi, 'var(--secondary)')
    .replace(/rgba\(212,\s*175,\s*55,\s*0\.[1-2]\)/gi, 'var(--border)')
    .replace(/rgba\(212,\s*175,\s*55,\s*0\.[3-4]\)/gi, 'var(--teal)')
    .replace(/#0a0a0f/g, 'var(--surface)');

  content = content.slice(0, brandingStart) + brandingSection;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('UI Refactoring Complete.');
