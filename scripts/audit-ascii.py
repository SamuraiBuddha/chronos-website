"""Print file:line U+XXXX for every non-ASCII character in tracked text files.

Usage: python scripts/audit-ascii.py   (run from the repo root)
Prints only code points, never the characters or the line text, so it cannot
die on a cp1252 console. Exit code 1 if anything is found.
"""
import subprocess
import sys

EXTS = ('.html', '.css', '.md', '.js', '.yml', '.xml', '.txt', '.mjs', '.svg')
files = subprocess.run(['git', 'ls-files'], capture_output=True, text=True, check=True).stdout.split('\n')
count = 0
for f in files:
    if not f.endswith(EXTS):
        continue
    with open(f, encoding='utf-8') as fh:
        for i, line in enumerate(fh, 1):
            for ch in line:
                if ord(ch) > 127:
                    print('%s:%d U+%04X' % (f, i, ord(ch)))
                    count += 1
print('nonascii=%d' % count)
sys.exit(1 if count else 0)
