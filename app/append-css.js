const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'app', 'globals.css');

fs.appendFileSync(cssPath, `
@keyframes slow-pan {
  0% { background-position: 0 0; }
  100% { background-position: 100% 100%; }
}

.admin-dashboard-container {
  animation: slow-pan 120s linear infinite;
}
`, 'utf8');

console.log('Appended animated texture css.');
