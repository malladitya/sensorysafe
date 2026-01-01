
/**
 * Loads the shared header and footer components.
 */
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('components/header.html', 'site-header-placeholder', initHeader);
    loadComponent('components/footer.html', 'site-footer-placeholder', initFooter);
});

function loadComponent(url, placeholderId, callback) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            return response.text();
        })
        .then(html => {
            placeholder.innerHTML = html;
            if (callback) callback();
        })
        .catch(error => console.error(error));
}

function initHeader() {
    // Mobile nav toggle logic from script.js
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');

    if (navToggle && nav) {
        navToggle.addEventListener('click', () => {
            const expanded = nav.getAttribute('aria-expanded') === 'true';
            nav.setAttribute('aria-expanded', String(!expanded));
            navToggle.setAttribute('aria-expanded', String(!expanded));
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                nav.setAttribute('aria-expanded', 'false');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Highlight active link logic could go here if needed
}

function initFooter() {
    // Update year
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// Global accessibility helpers
document.addEventListener('DOMContentLoaded', () => {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            // Default behavior is fine for navigation, but we want to ensure focus moves
            const targetId = skipLink.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const target = document.querySelector(targetId);
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            }
        });
    }
});
