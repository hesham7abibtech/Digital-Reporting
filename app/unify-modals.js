const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'components', 'admin');
const sharedDir = path.join(__dirname, 'src', 'components', 'shared');

const adminFiles = fs.readdirSync(adminDir).filter(f => f.endsWith('Modal.tsx') || f === 'GroupPolicyEditor.tsx' || f === 'BulkActionConfirmModal.tsx');
const sharedFiles = ['EliteConfirmModal.tsx', 'ProfileInfoModal.tsx'];

const allFiles = [
  ...adminFiles.map(f => path.join(adminDir, f)),
  ...sharedFiles.map(f => path.join(sharedDir, f))
];

allFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Backdrop Unification (Light Teal Tint + Blur)
  content = content.replace(/background:\s*'rgba\(0,0,0,0\.[468]\)'/g, "background: 'rgba(0, 63, 73, 0.3)', backdropFilter: 'blur(12px)'");
  
  // 2. Container Unification (Cotton background + Premium Radius + Shadow)
  content = content.replace(/background:\s*'#0a121e'/g, "background: 'var(--cotton)'");
  content = content.replace(/background:\s*'#12121a'/g, "background: 'var(--cotton)'");
  content = content.replace(/background:\s*'#1a1b26'/g, "background: 'var(--cotton)'");
  content = content.replace(/background:\s*'#050508'/g, "background: 'var(--cotton)'");
  content = content.replace(/borderRadius:\s*32/g, "borderRadius: 28");
  content = content.replace(/borderRadius:\s*20/g, "borderRadius: 28");
  
  // 3. Header Styling (Ultra Contrast Teal)
  content = content.replace(/(fontSize:\s*20,\s*fontWeight:\s*700)/g, "fontSize: 22, fontWeight: 900, color: 'var(--teal)', letterSpacing: '-0.02em'");
  content = content.replace(/borderBottom:\s*'1px solid rgba\(255,255,255,0\.08\)'/g, "borderBottom: '1px solid var(--border)'");
  content = content.replace(/borderBottom:\s*'1px solid var\(--border\)'/g, "borderBottom: '1px solid var(--border)'");

  // 4. Input & Field Styling (High Contrast Tech Light)
  // Fix background: '#1a1a24' or similar in selects/inputs
  content = content.replace(/background:\s*'#1a1a24'/g, "background: 'var(--section-bg)'");
  content = content.replace(/background:\s*'#1a1224'/g, "background: 'var(--section-bg)'");
  content = content.replace(/background:\s*'rgba\(255,255,255,0\.02\)'/g, "background: 'var(--section-bg)'");
  content = content.replace(/background:\s*'rgba\(255,255,255,0\.05\)'/g, "background: 'var(--secondary)'");
  
  // 5. Label Styling (Strict Contrast)
  content = content.replace(/(color:\s*)'var\(--text-secondary\)'(,\s*marginBottom:\s*8,\s*textTransform:\s*'uppercase')/g, "$1'var(--teal)'$2");
  content = content.replace(/(color:\s*)'var\(--text-dim\)'(,\s*textTransform:\s*'uppercase')/g, "$1'var(--teal)'$2");

  // 6. Role Card Styling (Specific to UserEditorModal)
  content = content.replace(/background:\s*formData\.role === 'OWNER' \? 'rgba\(212, 175, 55, 0\.1\)' : 'rgba\(255,255,255,0\.02\)'/g, "background: formData.role === 'OWNER' ? 'var(--secondary)' : 'var(--section-bg)'");
  content = content.replace(/color:\s*formData\.role === 'OWNER' \? 'var\(--teal\)' : 'var\(--text-secondary\)'/g, "color: 'var(--teal)'");

  // 7. Footer Unification
  content = content.replace(/background:\s*'rgba\(0,0,0,0\.2\)'/g, "background: 'var(--section-bg)'");

  // 8. Buttons Cleanup
  // Ensure "Cancel" button is visible
  content = content.replace(/(background:\s*'var\(--section-bg\)',\s*color:\s*)'var\(--text-primary\)'/g, "$1'var(--teal)'");

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log("Unified Admin Modals to Light-Teal Branding!");
