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

        fetch(betaForm.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        })
        .then(function (response) {
            if (response.ok) {
                var downloads = {
                    windows: 'https://github.com/SamuraiBuddha/chronos-releases/releases/download/v2.0.0-beta/Chronos.Timekeeping.Setup.0.1.0.exe',
                    macos: 'https://github.com/SamuraiBuddha/chronos-releases/releases/download/v2.0.0-beta/Chronos.Timekeeping-0.1.0-arm64.dmg',
                    linux: 'https://github.com/SamuraiBuddha/chronos-releases/releases/download/v2.0.0-beta/Chronos.Timekeeping-0.1.0.AppImage'
                };

                betaForm.innerHTML =
                    '<div class="form-success">' +
                    '<h3>You\'re in!</h3>' +
                    '<p>Your download should start automatically. If it doesn\'t, click the button below.</p>' +
                    '<a href="' + downloads[platform] + '" class="btn-primary btn-submit">Download for ' +
                    platform.charAt(0).toUpperCase() + platform.slice(1) + '</a>' +
                    '<p style="margin-top: 1rem; opacity: 0.8; font-size: 0.875rem;">We\'ll email you setup instructions and beta updates.</p>' +
                    '</div>';

                if (downloads[platform]) {
                    window.location.href = downloads[platform];
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
