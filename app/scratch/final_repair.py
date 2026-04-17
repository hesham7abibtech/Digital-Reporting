import re
import os

path = 'src/app/admin/dashboard/page.tsx'
if not os.path.exists(path):
    print(f"Error: {path} not found")
    exit(1)

with open(path, 'rb') as f:
    data = f.read()

# 1. Correct the first ID cell (Tasks loop) to use task.id
# We match the broken review.id and replace it with task.id
# UTF-8 for em-dash is \xe2\x80\x94
data = re.sub(rb'\{review\.id \|\| \'.*?\'\}', b'{task.id || \'\xe2\x80\x94\'}', data, count=1)

# 2. Mark the second ID cell (Users loop) for removal
data = re.sub(rb'\{review\.id \|\| \'.*?\'\}', b'REMOVEME_MARKER', data, count=1)

# 3. Remove the entire TD block containing the marker
# We use flags=re.DOTALL to match across newlines
# Note: In binary mode, we must use byte strings for everything
pattern = rb'<td style={{ padding: \'24px 16px\', textAlign: \'center\' }}>\s*<div style={{ fontSize: 13, color: \'var\(--text-dim\)\', fontWeight: 700, letterSpacing: \'0.02em\', whiteSpace: \'nowrap\' }}>REMOVEME_MARKER</div>\s*</td>'
data = re.sub(pattern, b'', data, flags=re.DOTALL)

# 4. Final encoding cleanup for any remaining corrupted dashes
data = data.replace(b'\xc3\xa2\xe2\x82\xac\xe2\x80\x94', b'\xe2\x80\x94')

with open(path, 'wb') as f:
    f.write(data)

print("Final precision repair completed")
