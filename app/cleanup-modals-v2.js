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

  // 1. Fix duplicate backdropFilter
  content = content.replace(/backdropFilter:\s*'blur\(12px\)',\s*backdropFilter:\s*'blur\(8px\)'/g, "backdropFilter: 'blur(12px)'");
  
  // 2. Standardize Red/Error colors to var(--status-error)
  content = content.replace(/color:\s*'#ef4444'/g, "color: 'var(--status-error)'");
  content = content.replace(/color:\s*'#f87171'/g, "color: 'var(--status-error)'");
  content = content.replace(/background:\s*'rgba\(239,\s*68,\s*68,\s*0\.0[58]\)'/g, "background: 'rgba(239, 68, 68, 0.08)'");
  
  // 3. Fix "TEAM MATE" button color in UserEditorModal specifically
  content = content.replace(/color: \(formData\.role === 'TEAM_MATE' && !formData\.policyId\) \? 'white' : 'var\(--text-secondary\)'/g, "color: (formData.role === 'TEAM_MATE' && !formData.policyId) ? 'var(--cotton)' : 'var(--teal)'");
  
  // 4. Ensure all modals have z-index 1000 and inset 0
  content = content.replace(/style={{ position: 'fixed', inset: 0, zIndex: 1000/g, "style={{ position: 'fixed', inset: 0, zIndex: 1000");

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log("Finalized Admin Modal Polish & Cleanup!");
