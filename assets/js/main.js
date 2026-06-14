// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
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
    } catch (e) { return null; }
}

function setCachedDownloads(urls) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), urls: urls })); } catch (e) {}
}

var FALLBACK_DOWNLOADS = {
    windows: 'https://github.com/SamuraiBuddha/chronos-releases/releases/latest/download/Chronos.Timekeeping.1.0.14.msi',
    macos: 'https://github.com/SamuraiBuddha/chronos-releases/releases/latest/download/Chronos.Timekeeping-1.0.14-arm64.dmg',
    linux: 'https://github.com/SamuraiBuddha/chronos-releases/releases/latest/download/Chronos.Timekeeping-1.0.14.AppImage'
};

var latestDownloads = null;
var latestDownloadsPromise = (function () {
    var cached = getCachedDownloads();
    if (cached) {
        latestDownloads = cached;
        return Promise.resolve(cached);
    }
    return fetch('https://api.github.com/repos/SamuraiBuddha/chronos-releases/releases/latest')
        .then(function (res) { return res.json(); })
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
            // Only cache if we got valid URLs
            if (urls.windows && urls.macos && urls.linux) {
                setCachedDownloads(urls);
                latestDownloads = urls;
            } else {
                latestDownloads = FALLBACK_DOWNLOADS;
            }
            return latestDownloads;
        })
        .catch(function () {
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

// Beta sign-up form: submit to Formspree then trigger download
const betaForm = document.querySelector('.beta-form');
if (betaForm) {
    betaForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(betaForm);
        const platform = formData.get('platform');
        const submitBtn = betaForm.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;

        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        Promise.all([
            fetch(betaForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            }),
            latestDownloadsPromise
        ])
        .then(function (results) {
            var response = results[0];
            var downloads = results[1];
            if (response.ok) {
                var dlUrl = downloads[platform] || FALLBACK_DOWNLOADS[platform];
                betaForm.innerHTML =
                    '<div class="form-success">' +
                    '<h3>You\'re in!</h3>' +
                    '<p>Your download should start automatically. If it doesn\'t, click the button below.</p>' +
                    '<a href="' + dlUrl + '" target="_blank" rel="noopener noreferrer" class="btn-primary btn-submit">Download for ' +
                    platform.charAt(0).toUpperCase() + platform.slice(1) + '</a>' +
                    '<p style="margin-top: 1rem; opacity: 0.8; font-size: 0.875rem;">We\'ll email you setup instructions and beta updates.</p>' +
                    '</div>';

                if (dlUrl) {
                    window.open(dlUrl, '_blank', 'noopener,noreferrer');
                }
            } else {
                submitBtn.textContent = 'Something went wrong. Try again.';
                submitBtn.disabled = false;
                setTimeout(function () { submitBtn.textContent = originalText; }, 3000);
            }
        })
        .catch(function () {
            submitBtn.textContent = 'Network error. Try again.';
            submitBtn.disabled = false;
            setTimeout(function () { submitBtn.textContent = originalText; }, 3000);
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
        } catch (e) { /* storage unavailable -- gate still enforced in-session */ }
    }

    // Initialize from any prior acceptance of the current version.
    var prior = null;
    try { prior = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); } catch (e) {}
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
