// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href === '#') {
            // A bare "#" (the logo) is not a valid selector -- querySelector('#') throws.
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Fetch latest release download URLs from chronos-releases
// Uses localStorage cache (1hr TTL) to avoid GitHub API rate limits
var CACHE_KEY = 'chronos_downloads_cache';
var CACHE_TTL = 3600000; // 1 hour

function getCachedDownloads() {
    try {
        var raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        var cached = JSON.parse(raw);
        if (Date.now() - cached.ts > CACHE_TTL) return null;
        return cached.urls;
    } catch (e) {
        console.warn('[downloads] could not read the download cache (ignoring it): ' + e);
        return null;
    }
}

function setCachedDownloads(urls) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), urls: urls }));
    } catch (e) {
        console.warn('[downloads] could not write the download cache: ' + e);
    }
}

// DO NOT put a versioned filename here. GitHub's /releases/latest/download/<name>
// route only resolves when that EXACT filename exists in the newest release, so a
// pinned name 404s the moment the next version ships. These were pinned to 1.0.14
// and had been dead since v1.0.15 (2026-07-01) -- silently, because the happy path
// below rewrites the hrefs from the API and nobody exercises the fallback.
//
// The releases page always resolves regardless of version, so it cannot rot. It is
// one extra click, which is the correct trade for a link that is only reached when
// the API call fails (unauthenticated rate limit, offline, or JS blocked).
var RELEASES_PAGE = 'https://github.com/SamuraiBuddha/chronos-releases/releases/latest';

var FALLBACK_DOWNLOADS = {
    windows: RELEASES_PAGE,
    macos: RELEASES_PAGE,
    linux: RELEASES_PAGE
};

var latestDownloads = null;
var latestDownloadsPromise = (function () {
    var cached = getCachedDownloads();
    if (cached) {
        latestDownloads = cached;
        return Promise.resolve(cached);
    }
    return fetch('https://api.github.com/repos/SamuraiBuddha/chronos-releases/releases/latest')
        .then(function (res) {
            if (!res.ok) {
                // e.g. 403 rate limit. Without this the JSON error body parses fine and
                // is misreported as "release has no asset for every platform".
                throw new Error('GitHub API responded HTTP ' + res.status);
            }
            return res.json();
        })
        .then(function (release) {
            var assets = release.assets || [];
            var urls = { windows: null, macos: null, linux: null };
            assets.forEach(function (asset) {
                var name = asset.name;
                if (name.match(/\.msi$/)) {
                    urls.windows = asset.browser_download_url;
                } else if (name.match(/arm64\.dmg$/) && !name.match(/blockmap$/)) {
                    urls.macos = asset.browser_download_url;
                } else if (name.match(/\.AppImage$/)) {
                    urls.linux = asset.browser_download_url;
                }
            });
            // Per platform, never all-or-nothing. v1.2.0 shipped without a macOS
            // build, and the old "windows && macos && linux" check sent EVERY button
            // (Windows and Linux too) to the releases page instead of the file.
            // A platform missing from the release falls back alone, loudly.
            var missing = [];
            Object.keys(urls).forEach(function (platform) {
                if (!urls[platform]) {
                    missing.push(platform);
                    urls[platform] = RELEASES_PAGE;
                }
            });
            if (missing.length) {
                console.warn('[downloads] release ' + release.tag_name + ' has no asset for: ' +
                    missing.join(', ') + ' -- those buttons open the releases page');
            }
            if (missing.length < 3) {
                setCachedDownloads(urls);
            }
            latestDownloads = urls;
            return latestDownloads;
        })
        .catch(function (err) {
            console.warn('[downloads] GitHub release lookup failed, all buttons open the releases page: ' + err);
            latestDownloads = FALLBACK_DOWNLOADS;
            return latestDownloads;
        });
}());

// Wire up trial download buttons to latest release URLs
var downloadButtons = document.querySelectorAll('.btn-download-platform');
if (downloadButtons.length > 0) {
    latestDownloadsPromise.then(function (downloads) {
        downloadButtons.forEach(function (btn) {
            var platform = btn.getAttribute('data-platform');
            if (downloads[platform]) {
                btn.href = downloads[platform];
            }
        });
    });
}

// Add active state to navigation on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// --- Stripe subscription Payment Links -------------------------------------
// Paste the live Payment Link URLs created in the Stripe dashboard here.
// Buttons carry data-stripe="<key>"; any key left empty keeps its HTML href
// fallback (the sales mailto), so checkout never lands on a dead link.
// See docs/STRIPE-SETUP.md for how to create these links.
var STRIPE_LINKS = {
    proMonthly: 'https://buy.stripe.com/4gMeVf6a6bh67qo3lpao800', // Pro $9.99/mo (live)
    proAnnual: 'https://buy.stripe.com/3cI6oJ6a65WMfWU2hlao801'   // Pro $99.99/yr (live)
};

document.querySelectorAll('[data-stripe]').forEach(function (el) {
    var url = STRIPE_LINKS[el.getAttribute('data-stripe')];
    if (url) {
        el.setAttribute('href', url);
        el.setAttribute('rel', 'noopener');
    }
});

// --- Legal consent gate ----------------------------------------------------
// Buttons marked [data-requires-consent] are blocked until the #legal-consent
// checkbox is ticked. When accepted we record the event in localStorage
// (timestamp + document versions) as a client-side trail. The AUTHORITATIVE
// record of acceptance should also be captured at checkout -- enable
// "Require customers to accept your terms of service" on the Stripe Payment
// Link, which stamps consent on the Checkout Session server-side.
(function () {
    var LEGAL_VERSION = '2026-06-13'; // bump when terms/disclaimer/privacy change
    var CONSENT_KEY = 'chronos_legal_consent';

    var checkbox = document.getElementById('legal-consent');
    var errorEl = document.getElementById('consent-error');
    var gated = document.querySelectorAll('[data-requires-consent]');
    if (!gated.length) return; // nothing to gate on this page

    function setDisabled(disabled) {
        gated.forEach(function (btn) {
            btn.classList.toggle('btn-disabled', disabled);
            btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        });
    }

    function recordConsent() {
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify({
                accepted: true,
                at: new Date().toISOString(),
                version: LEGAL_VERSION,
                documents: ['terms', 'disclaimer', 'privacy'],
                page: location.pathname
            }));
        } catch (e) {
            // Storage unavailable: the gate is still enforced in-session, only the trail is lost.
            console.warn('[consent] could not record consent to localStorage: ' + e);
        }
    }

    // Initialize from any prior acceptance of the current version.
    var prior = null;
    try {
        prior = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
    } catch (e) {
        console.warn('[consent] could not read prior consent from localStorage (treating as none): ' + e);
    }
    if (checkbox && prior && prior.accepted && prior.version === LEGAL_VERSION) {
        checkbox.checked = true;
    }
    setDisabled(!(checkbox && checkbox.checked));

    if (checkbox) {
        checkbox.addEventListener('change', function () {
            setDisabled(!checkbox.checked);
            if (errorEl) errorEl.hidden = checkbox.checked;
            if (checkbox.checked) recordConsent();
        });
    }

    gated.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            if (!checkbox || !checkbox.checked) {
                e.preventDefault();
                if (errorEl) errorEl.hidden = false;
                if (checkbox) {
                    checkbox.focus();
                    var gate = checkbox.closest('.consent-gate');
                    if (gate) {
                        gate.classList.remove('consent-shake');
                        // reflow so the animation can replay on each blocked click
                        void gate.offsetWidth;
                        gate.classList.add('consent-shake');
                    }
                }
                return;
            }
            recordConsent(); // refresh timestamp at the moment of checkout
        });
    });
})();
