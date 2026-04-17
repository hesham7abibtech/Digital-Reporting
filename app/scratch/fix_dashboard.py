import re
import os

path = 'src/app/admin/dashboard/page.tsx'
if not os.path.exists(path):
    print(f"Error: {path} not found")
    exit(1)

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Standardize ID format in getImportNextId
# Correct the prefix format
content = re.sub(r'const prefix = `REH-\$\{abbr\}-`', 'const prefix = `REH - ${abbr} - `', content)
# Correct the split logic for parsing existing IDs
content = content.replace("t.id.split(' - ')", "t.id.split(' - ')")

# 2. Adjust Task Name body column width from 500px to 400px
content = content.replace("width: '500px'", "width: '400px'")

# 3. Remove the incorrectly injected ID cells from BIM Reviews and Users tabs
# These cells use 'task.id' which is undefined in those loops
id_cell_pattern = re.compile(r'<td style={{ padding: \'24px 16px\', textAlign: \'center\' }}>\s*<div style={{ fontSize: 13, color: \'var\(--text-dim\)\', fontWeight: 700, letterSpacing: \'0.02em\', whiteSpace: \'nowrap\' }}>\{task\.id \|\| \'.*?\'\}</div>\s*</td>', re.DOTALL)

# Find the loop blocks to avoid touching the 'tasks' loop where it IS valid
# The tasks loop starts with activeTab === 'tasks'
tasks_match = re.search(r"activeTab === 'tasks' && tasksSnapshot", content)
bim_match = re.search(r"activeTab === 'bim-reviews' && bimReviewsSnapshot", content)
users_match = re.search(r"activeTab === 'users' && activeSubTab === 'users'", content)

if tasks_match and bim_match and users_match:
    # We want to remove the id cell from the BIM and Users blocks
    # Everything from bim_match onwards might contain valid id cells for other things, 
    # but the ones with {task.id} are definitely wrong in those loops.
    
    # Let's target the BIM block specifically
    bim_end = content.find("activeTab === 'bim-reviews' && bimReviewsSnapshot?.docs.length === 0", bim_match.start())
    if bim_end != -1:
        bim_sub = content[bim_match.start():bim_end]
        fixed_bim_sub = id_cell_pattern.sub('', bim_sub)
        content = content[:bim_match.start()] + fixed_bim_sub + content[bim_end:]
    
    # Re-find users_match because the index might have shifted
    users_match = re.search(r"activeTab === 'users' && activeSubTab === 'users'", content)
    if users_match:
        users_end = content.find("activeTab === 'users' && activeSubTab === 'users' && usersSnapshot?.docs.length === 0", users_match.start())
        if users_end != -1:
            users_sub = content[users_match.start():users_end]
            fixed_users_sub = id_cell_pattern.sub('', users_sub)
            content = content[:users_match.start()] + fixed_users_sub + content[users_end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fix applied successfully")
