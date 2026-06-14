#!/usr/bin/env node
/*
 * build-legal.js -- generate styled legal HTML pages from the markdown sources.
 *
 * Source of truth:  legal/terms.md, legal/disclaimer.md, legal/privacy.md
 * Output (site root): terms.html, disclaimer.html, privacy.html
 *
 * Re-run after editing any legal/*.md:   node scripts/build-legal.js
 *
 * The converter handles the markdown constructs actually used in these
 * documents: ATX headings, ordered/unordered lists, blockquotes, horizontal
 * rules, bold/italic/inline-code, and links. It is intentionally small and has
 * no third-party dependencies so it runs anywhere Node is present.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEGAL_DIR = path.join(ROOT, 'legal');

const PAGES = [
  { src: 'terms.md',      out: 'terms.html',      title: 'Terms of Service & EULA', slug: 'terms' },
  { src: 'disclaimer.md', out: 'disclaimer.html', title: 'Disclaimer',              slug: 'disclaimer' },
  { src: 'privacy.md',    out: 'privacy.html',    title: 'Privacy Policy',           slug: 'privacy' },
];

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Inline formatting -- run AFTER escaping so injected tags survive.
function inline(text) {
  let t = escapeHtml(text);
  // links [text](url)  (escaped '>' inside url is unlikely; urls here are plain)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // bold **text**
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic *text*
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  // inline code `code`
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (buf.length) out.push('<p>' + inline(buf.join(' ')) + '</p>');
    return [];
  };

  let para = [];

  // A line that continues the current list item (lazy continuation): non-blank
  // and not the start of any other block-level construct.
  const isContinuation = (l) =>
    !/^\s*$/.test(l) &&
    !/^\d+\.\s+/.test(l) &&
    !/^\s*-\s+/.test(l) &&
    !/^#{1,6}\s/.test(l) &&
    !/^---+\s*$/.test(l) &&
    !/^>\s?/.test(l);

  while (i < lines.length) {
    let line = lines[i];

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      para = flushParagraph(para);
      out.push('<hr>');
      i++;
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      para = flushParagraph(para);
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote (consecutive '>' lines)
    if (/^>\s?/.test(line)) {
      para = flushParagraph(para);
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      // collapse blank lines into paragraph breaks inside the quote
      const parts = quote.join('\n').split(/\n\s*\n/).map(p => p.replace(/\n/g, ' ').trim());
      out.push('<blockquote>' + parts.map(p => '<p>' + inline(p) + '</p>').join('') + '</blockquote>');
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      para = flushParagraph(para);
      out.push('<ol>');
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\d+\.\s+/, '');
        i++;
        while (i < lines.length && isContinuation(lines[i])) {
          item += ' ' + lines[i].trim();
          i++;
        }
        out.push('<li>' + inline(item) + '</li>');
      }
      out.push('</ol>');
      continue;
    }

    // Unordered list
    if (/^\s*-\s+/.test(line)) {
      para = flushParagraph(para);
      out.push('<ul>');
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*-\s+/, '');
        i++;
        while (i < lines.length && isContinuation(lines[i])) {
          item += ' ' + lines[i].trim();
          i++;
        }
        out.push('<li>' + inline(item) + '</li>');
      }
      out.push('</ul>');
      continue;
    }

    // Blank line -> paragraph break
    if (/^\s*$/.test(line)) {
      para = flushParagraph(para);
      i++;
      continue;
    }

    // Default: accumulate paragraph text
    para.push(line.trim());
    i++;
  }
  flushParagraph(para);
  return out.join('\n');
}

const NAV = `    <nav class="navbar">
        <div class="container">
            <div class="nav-brand">
                <a href="index.html">
                    <img src="assets/images/logo.png" alt="Chronos Timekeeping" class="nav-logo">
                    <span>Chronos</span>
                </a>
            </div>
            <ul class="nav-menu">
                <li><a href="index.html#how-it-works">How It Works</a></li>
                <li><a href="index.html#features">Features</a></li>
                <li><a href="pricing.html">Pricing</a></li>
                <li><a href="pricing.html" class="btn-cta">Get Started</a></li>
            </ul>
        </div>
    </nav>`;

const FOOTER = `    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-section">
                    <h4>Chronos Timekeeping</h4>
                    <p>Automatic, privacy-first time tracking for professionals who bill by the hour.</p>
                    <p class="patent-notice">Patent Pending<br>U.S. Provisional Patent Application No. 63/968,309</p>
                </div>
                <div class="footer-section">
                    <h4>Product</h4>
                    <ul>
                        <li><a href="index.html#how-it-works">How It Works</a></li>
                        <li><a href="index.html#features">Features</a></li>
                        <li><a href="pricing.html">Pricing</a></li>
                        <li><a href="pricing.html">Get Started</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Support</h4>
                    <ul>
                        <li><a href="mailto:support@chronos-timekeeping.com">Contact Support</a></li>
                        <li><a href="mailto:sales@chronos-timekeeping.com">Sales Inquiries</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Legal</h4>
                    <ul>
                        <li><a href="privacy.html">Privacy Policy</a></li>
                        <li><a href="terms.html">Terms of Service</a></li>
                        <li><a href="disclaimer.html">Disclaimer</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Jordan P. Ehrig, Sr. All rights reserved.</p>
                <p class="patent-footer">Chronos Timekeeping &mdash; U.S. Provisional Patent Application No. 63/968,309</p>
            </div>
        </div>
    </footer>`;

const LEGAL_STYLE = `    <style>
        .legal-hero { background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: #fff; padding: 3rem 0 2.5rem; }
        .legal-hero h1 { font-size: 2rem; margin: 0; }
        .legal-hero p { opacity: 0.9; margin-top: 0.5rem; }
        .legal-body { max-width: 820px; margin: 0 auto; padding: 3rem 2rem 4rem; }
        .legal-body h1 { font-size: 1.9rem; margin: 2rem 0 1rem; }
        .legal-body h2 { font-size: 1.4rem; margin: 2.25rem 0 0.85rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); color: var(--text-dark); }
        .legal-body h3 { font-size: 1.1rem; margin: 1.5rem 0 0.6rem; color: var(--text-dark); }
        .legal-body p { margin: 0.75rem 0; color: var(--text-dark); }
        .legal-body ul, .legal-body ol { margin: 0.75rem 0 0.75rem 1.5rem; }
        .legal-body li { margin: 0.4rem 0; }
        .legal-body a { color: var(--primary-color); }
        .legal-body code { background: var(--bg-light); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.9em; word-break: break-word; }
        .legal-body hr { border: none; border-top: 1px solid var(--border-color); margin: 2rem 0; }
        .legal-body blockquote { background: var(--bg-light); border-left: 4px solid var(--primary-color); border-radius: 0 6px 6px 0; padding: 0.9rem 1.2rem; margin: 1.25rem 0; color: var(--text-light); }
        .legal-body blockquote p { color: inherit; margin: 0.4rem 0; }
        .legal-body strong { color: var(--text-dark); }
        .legal-toc { background: var(--bg-light); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 2rem; font-size: 0.95rem; }
    </style>`;

function page({ title, bodyHtml, slug }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Chronos Timekeeping</title>
    <meta name="description" content="${title} for Chronos Timekeeping automatic time tracking software.">
    <meta name="author" content="Jordan P. Ehrig, Sr.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://chronos-timekeeping.com/${slug}.html">
    <meta name="theme-color" content="#6366f1">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/images/logo.png">
    <link rel="apple-touch-icon" sizes="180x180" href="assets/images/logo.png">
    <link rel="stylesheet" href="assets/css/styles.css">
${LEGAL_STYLE}
</head>
<body>
${NAV}
    <main class="legal-body">
${bodyHtml}
    </main>
${FOOTER}
    <script src="assets/js/main.js?v=3"></script>
</body>
</html>
`;
}

let built = 0;
for (const p of PAGES) {
  const srcPath = path.join(LEGAL_DIR, p.src);
  if (!fs.existsSync(srcPath)) {
    console.error(`[build-legal] SKIP ${p.src} (not found at ${srcPath})`);
    continue;
  }
  const md = fs.readFileSync(srcPath, 'utf8');
  const bodyHtml = mdToHtml(md);
  const html = page({ title: p.title, bodyHtml, slug: p.slug });
  fs.writeFileSync(path.join(ROOT, p.out), html, 'utf8');
  console.log(`[build-legal] wrote ${p.out} (${html.length} bytes) from ${p.src}`);
  built++;
}
console.log(`[build-legal] done -- ${built} page(s) generated.`);
