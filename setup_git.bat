@echo off
echo # Digital-Reporting > README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/hesham7abibtech/Digital-Reporting.git
git push -u origin main
