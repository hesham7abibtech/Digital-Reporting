const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace activeTab === 'users' with activeTab === 'access' for all conditional UI rendering 
content = content.replace(/activeTab === 'users'/g, "activeTab === 'access'");

// Also checking for setActiveTab('users') if it accidentally routes back and replacing it (shouldn't be needed but just in case)
content = content.replace(/setActiveTab\('users'\)/g, "setActiveTab('access')");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed Access Control Tab String References!");
