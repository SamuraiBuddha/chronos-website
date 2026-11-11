"""Check that every local href/src in every tracked HTML file resolves.

Resolves files relative to the page; for page.html#frag also checks that the
fragment exists as an id in the target page. External (http/https/mailto/tel)
links are skipped and counted separately. Run from the repo root.

Prints: checked count, broken list, and a final machine-readable line.
Exit code 1 if anything is broken.
"""
import os
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

files = [f for f in subprocess.run(['git', 'ls-files'], capture_output=True, text=True, check=True)
         .stdout.split('\n') if f.endswith('.html')]

ATTR = re.compile(r'''\b(?:href|src)\s*=\s*("([^"]*)"|'([^']*)')''', re.I)
ID = re.compile(r'''\bid\s*=\s*["']([^"']+)["']''', re.I)

ids = {}
for f in files:
    ids[f] = set(ID.findall(open(f, encoding='utf-8').read()))

checked = 0
external = 0
broken = []
for f in files:
    text = open(f, encoding='utf-8').read()
    # drop HTML comments so documented examples are not checked
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    for m in ATTR.finditer(text):
        raw = m.group(2) if m.group(2) is not None else m.group(3)
        if not raw.strip():
            broken.append('%s: empty reference' % f)
            continue
        parts = urlsplit(raw)
        if parts.scheme in ('http', 'https', 'mailto', 'tel', 'data', 'javascript'):
            external += 1
            continue
        checked += 1
        path = unquote(parts.path)
        if path == '':
            target = f
        else:
            target = os.path.normpath(os.path.join(os.path.dirname(f), path))
        if not os.path.isfile(target):
            broken.append('%s -> %s (missing file)' % (f, raw))
            continue
        if parts.fragment and target.endswith('.html'):
            if parts.fragment not in ids.get(target, set()):
                broken.append('%s -> %s (no id "%s")' % (f, raw, parts.fragment))

print('html files: %d' % len(files))
print('local refs checked: %d (external skipped: %d)' % (checked, external))
print('broken: %d' % len(broken))
for b in broken:
    print('  ' + b)
sys.exit(1 if broken else 0)
