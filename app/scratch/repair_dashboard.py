import re
import os

path = 'src/app/admin/dashboard/page.tsx'
if not os.path.exists(path):
    print(f"Error: {path} not found")
    exit(1)

with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Deduplicate </td> tags
# Matches </td> followed by optional whitespace/newlines and another </td>
c = re.sub(r'</td>\s*</td>', '</td>', c)

# 2. Fix variable scoping in non-task loops
# BIM loop
# We find the BIM loop and replace {task.id || ...} with {review.id || ...}
bim_block_match = re.search(r"activeTab === 'bim-reviews' && bimReviewsSnapshot.*?\.map\((.*?)\) => {", c, re.DOTALL)
if bim_block_match:
    # We find where this loop ends. It's complex, so we'll just target the specific broken line 
    # if it's within the bim block area.
    # Actually, we can just replace {task.id || '—'} with {review.id || '—'} GLOBALLY 
    # IF it's in a block that contains 'review.' and NOT 'task ='.
    pass

# Better approach for scoping:
# Task loop uses 'task'. BIM uses 'review'. Users uses 'userRec'.
# I'll specifically target the ID cells in those loops.

# Repair BIM loop id cell
# The broken cell looks like: <div ...>{task.id || '—'}</div>
c = re.sub(r"activeTab === 'bim-reviews'.*?\{task\.id \|\| '—'\}", lambda m: m.group(0).replace('task.id', 'review.id'), c, flags=re.DOTALL)

# Repair Users loop id cell
c = re.sub(r"activeTab === 'users' && activeSubTab === 'users'.*?\{task\.id \|\| '—'\}", lambda m: m.group(0).replace('task.id', 'doc.id'), c, flags=re.DOTALL)

# 3. Restore em-dash and fixed characters
c = c.replace('â€”', '—')

# 4. Standardize widths
# Header widths
c = re.sub(r"width: 500 }}\s*>\s*\{activeTab === 'users' \? 'Staff Identity'", "width: 400 }}>{activeTab === 'users' ? 'Staff Identity'", c)
c = re.sub(r"width: 220 }}\s*>\s*\{activeTab === 'tasks' \? 'Submitter'", "width: 180 }}>{activeTab === 'tasks' ? 'Submitter'", c)
# Body widths
c = c.replace("width: '500px'", "width: '400px'")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Repair completed successfully")
