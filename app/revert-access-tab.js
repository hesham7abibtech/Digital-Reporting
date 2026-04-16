const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'admin', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// REVERT: Replace activeTab === 'access' back to activeTab === 'users'
content = content.replace(/activeTab === 'access'/g, "activeTab === 'users'");

// REVERT: Replace setActiveTab('access') back to setActiveTab('users')
content = content.replace(/setActiveTab\('access'\)/g, "setActiveTab('users')");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Reverted Access Control Tab String References back to 'users'!");
