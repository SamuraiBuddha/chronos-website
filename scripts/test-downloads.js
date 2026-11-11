// Loads assets/js/main.js under node with a stubbed DOM + fetch and checks how the
// download buttons come out. Run: node scripts/test-downloads.js
// Exit code is non-zero if any case fails.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'main.js'), 'utf8');
const RELEASES_PAGE = 'https://github.com/SamuraiBuddha/chronos-releases/releases/latest';

function makeButton(platform) {
    const attrs = { href: RELEASES_PAGE, 'data-platform': platform };
    const classes = new Set(['btn-download-platform']);
    const listeners = [];
    const btn = {
        textContent: 'Download for ' + platform,
        classList: {
            add: (c) => classes.add(c),
            remove: (c) => classes.delete(c),
            toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
            contains: (c) => classes.has(c),
        },
        getAttribute: (k) => (k in attrs ? attrs[k] : null),
        setAttribute: (k, v) => { attrs[k] = String(v); },
        removeAttribute: (k) => { delete attrs[k]; },
        hasAttribute: (k) => k in attrs,
        addEventListener: (ev, fn) => listeners.push([ev, fn]),
        click() {
            let prevented = false;
            listeners.filter((l) => l[0] === 'click').forEach((l) => l[1]({ preventDefault() { prevented = true; } }));
            return prevented;
        },
    };
    Object.defineProperty(btn, 'href', {
        get: () => (attrs.href === undefined ? '' : attrs.href),
        set: (v) => { attrs.href = v; },
    });
    return btn;
}

async function runCase(name, fetchImpl, check) {
    const buttons = ['windows', 'macos', 'linux'].map(makeButton);
    const warnings = [];
    const store = {};
    const document = {
        querySelectorAll: (sel) => (sel === '.btn-download-platform' ? buttons : []),
        querySelector: () => null,
        getElementById: () => null,
    };
    const ctx = {
        document,
        window: { addEventListener() {}, scrollTo() {}, pageYOffset: 0 },
        localStorage: {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
        },
        fetch: fetchImpl,
        console: { warn: (m) => warnings.push(String(m)), log() {}, error() {} },
        location: { pathname: '/' },
        Date, JSON, Promise, Object, Array, Error, String, setTimeout,
    };
    vm.createContext(ctx);
    vm.runInContext(SRC, ctx, { filename: 'main.js' });
    // Let the fetch chain and the wiring .then settle.
    for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
    let ok = false;
    let detail = '';
    try {
        check({ win: buttons[0], mac: buttons[1], lin: buttons[2], warnings, store });
        ok = true;
    } catch (e) {
        detail = e.message;
    }
    console.log((ok ? '[PASS] ' : '[FAIL] ') + name + (detail ? ' -- ' + detail : ''));
    return ok;
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

function releaseResponse(names) {
    return () => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
            tag_name: 'vTEST',
            assets: names.map((n) => ({ name: n, browser_download_url: 'https://dl.example/' + n })),
        }),
    });
}

const WIN = 'Chronos-1.2.0.msi';
const MAC = 'Chronos-1.2.0-arm64.dmg';
const MACMAP = 'Chronos-1.2.0-arm64.dmg.blockmap';
const LIN = 'Chronos-1.2.0.AppImage';

(async () => {
    const results = [];

    results.push(await runCase('all three assets present', releaseResponse([WIN, MAC, MACMAP, LIN]), (t) => {
        assert(t.win.href === 'https://dl.example/' + WIN, 'windows href ' + t.win.href);
        assert(t.mac.href === 'https://dl.example/' + MAC, 'macos href ' + t.mac.href);
        assert(t.lin.href === 'https://dl.example/' + LIN, 'linux href ' + t.lin.href);
        assert(t.mac.getAttribute('aria-disabled') === null, 'macos must not be disabled');
        assert(t.mac.textContent === 'Download for macos', 'macos text changed: ' + t.mac.textContent);
        assert(t.warnings.length === 0, 'unexpected warnings: ' + t.warnings.join(' | '));
    }));

    results.push(await runCase('macOS asset missing (v1.2.0 situation)', releaseResponse([WIN, LIN]), (t) => {
        assert(t.win.href === 'https://dl.example/' + WIN, 'windows must still point at its file: ' + t.win.href);
        assert(t.lin.href === 'https://dl.example/' + LIN, 'linux must still point at its file: ' + t.lin.href);
        assert(!t.mac.hasAttribute('href'), 'macos must have no href (no navigation)');
        assert(t.mac.getAttribute('aria-disabled') === 'true', 'macos must be aria-disabled');
        assert(t.mac.classList.contains('btn-unavailable'), 'macos must carry btn-unavailable');
        assert(/coming back soon/.test(t.mac.textContent), 'macos text: ' + t.mac.textContent);
        assert(t.mac.click() === true, 'macos click must be preventDefault-ed');
        assert(t.win.getAttribute('aria-disabled') === null && t.lin.getAttribute('aria-disabled') === null,
            'windows/linux must not be disabled');
        assert(t.warnings.some((w) => /no macos asset/.test(w)), 'expected a loud warning');
    }));

    results.push(await runCase('API 403 (rate limited)', () => Promise.resolve({
        ok: false, status: 403, json: () => Promise.resolve({ message: 'rate limit exceeded' }),
    }), (t) => {
        [t.win, t.mac, t.lin].forEach((b) => {
            assert(b.href === RELEASES_PAGE, 'button must fall back to releases page: ' + b.href);
            assert(b.getAttribute('aria-disabled') === null, 'a failed lookup must not disable ' + b.getAttribute('data-platform'));
        });
        assert(t.warnings.some((w) => /HTTP 403/.test(w)), 'warning must carry the real status: ' + t.warnings.join(' | '));
        assert(!t.warnings.some((w) => /has no asset for/.test(w)), 'must not misreport as missing assets');
    }));

    results.push(await runCase('release with zero matching assets (still uploading)', releaseResponse([]), (t) => {
        [t.win, t.mac, t.lin].forEach((b) => {
            assert(b.getAttribute('aria-disabled') === null, 'must not disable ' + b.getAttribute('data-platform'));
            assert(b.href === RELEASES_PAGE, 'must open releases page');
        });
    }));

    results.push(await runCase('macOS missing result is cached and replays disabled', releaseResponse([WIN, LIN]), (t) => {
        const cache = JSON.parse(t.store.chronos_downloads_cache_v2);
        assert(Array.isArray(cache.missing) && cache.missing.join() === 'macos', 'cache missing=' + JSON.stringify(cache.missing));
    }));

    const failed = results.filter((r) => !r).length;
    console.log(failed ? '\n' + failed + ' of ' + results.length + ' FAILED' : '\nall ' + results.length + ' passed');
    process.exit(failed ? 1 : 0);
})();
