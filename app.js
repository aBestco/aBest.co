// Final deployment trigger - Mar 7, 2026 13:27 (Protocol Test)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Logic
    const menuBtn = document.getElementById('menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuBtn.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // 2. Sticky Glass Header Logic
    const header = document.querySelector('.app-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('sticky');
            } else {
                header.classList.remove('sticky');
            }
        });
    }

    // 3. Scroll Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const animateOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    // Initial load animations (remove inline animation-delay logic and use class toggle instead)
    document.querySelectorAll('.fade-in-up').forEach((el, index) => {
        // We set transition delay dynamically instead of inline HTML styling to make it scalable
        el.style.transitionDelay = `${index * 0.15}s`;
        animateOnScroll.observe(el);
    });

    // 4. Cursor Spotlight Effect for Glass Cards
    const interactiveCards = document.querySelectorAll('.interactive');
    interactiveCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Set CSS variables for the spotlight position on each card
            card.style.setProperty('--spotlight-x', `${x}px`);
            card.style.setProperty('--spotlight-y', `${y}px`);
        });
    });

    // 5. Button Ripple Effect
    document.body.addEventListener('click', function (e) {
        if (e.target.classList.contains('ripple')) {
            const button = e.target;
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripples = document.createElement('span');
            ripples.style.left = x + 'px';
            ripples.style.top = y + 'px';
            ripples.classList.add('ripple-effect');
            button.appendChild(ripples);

            setTimeout(() => {
                ripples.remove()
            }, 600);
        }
    });

    // 6. Modal Logic (mostly used in Project pages)
    const modal = document.getElementById('project-modal');
    const modalClose = document.getElementById('modal-close');
    const modalBody = document.getElementById('modal-body');
    const exploreBtn = document.querySelector('.js-explore-btn');

    const openModal = (content) => {
        if (!modal || !modalBody) return;
        modalBody.innerHTML = content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            const projectTitle = document.querySelector('.featured-header h3').innerText;
            const projectTags = document.querySelector('.project-tags').innerText;
            const projectImg = document.querySelector('.image-preview img').src;

            const content = `
                <img src="${projectImg}" alt="${projectTitle}" style="width:100%; border-radius:16px; margin-bottom:1.5rem;">
                <h2 style="margin-bottom:0.5rem;">${projectTitle}</h2>
                <p style="color:var(--text-accent); margin-bottom:1rem;">${projectTags}</p>
                <p>Detailed project insights: This flagship development incorporates state-of-the-art infrastructure. The project emphasizes sustainable architecture and modern urban lifestyle.</p>
                <div class="divider" style="margin: 1.5rem 0;"></div>
                <button class="glass-button ripple" onclick="location.reload()">Back to Dashboard</button>
            `;
            openModal(content);
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // 6.5 Global Email Link to Contact Modal Logic
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href') || '';
        const text = link.innerText || '';

        // Check if it's an email link or specifically contains the brand email
        if (href.includes('mailto:i@aBest.co') || text.includes('i@aBest.co')) {
            e.preventDefault();
            openContactModal();
        } else if (href.includes('/admin/') || href.includes('/admin')) {
            e.preventDefault();
            openAuthModal();
        }
    });

    function openContactModal() {
        const lang = document.documentElement.lang || 'en';
        const content = getContactFormHTML(lang);
        openModal(content);

        // Re-initialize auto-expanding textarea for the new form
        const newTextarea = document.querySelector('#modal-body #message');
        if (newTextarea) {
            newTextarea.addEventListener('input', function () {
                this.style.height = '120px';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
    }

    function openAuthModal() {
        const lang = document.documentElement.lang || 'en';
        const sessionToken = localStorage.getItem('aBest_session');

        // If the user is already logged in, redirect them to admin or give them a menu.
        // For simplicity, directly route to the dashboard.
        if (sessionToken) {
            window.location.href = `/${lang}/profil.html`;
            return;
        }

        const content = getAuthFormHTML(lang);
        openModal(content);

        // Add listeners for tab switching inside auth modal
        const loginTab = document.getElementById('tab-login');
        const regTab = document.getElementById('tab-register');
        const loginForm = document.getElementById('login-form-content');
        const regForm = document.getElementById('register-form-content');

        if (loginTab && regTab && loginForm && regForm) {
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active');
                regTab.classList.remove('active');
                loginForm.style.display = 'block';
                regForm.style.display = 'none';
            });
            regTab.addEventListener('click', () => {
                regTab.classList.add('active');
                loginTab.classList.remove('active');
                regForm.style.display = 'block';
                loginForm.style.display = 'none';
            });
        }
    }

    // Check initial auth state to update icon
    checkAuthState();
});

function checkAuthState() {
    const sessionToken = localStorage.getItem('aBest_session');
    // We now redirect to the profile page instead of admin upon click
    const adminLink = document.querySelector('a[href*="/admin/"]');

    if (sessionToken && adminLink) {
        const lang = document.documentElement.lang || 'en';
        adminLink.href = `/${lang}/profil.html`;

        // Change the icon to indicate logged in state. 
        // We use a simple filled user icon for 'logged in'.
        adminLink.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="currentColor">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 0 0 0-4 4v2"></path>
               <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    }
}

// Language Switcher Logic
function setLang(lang) {
    localStorage.setItem('aBest_lang', lang);
}

// Language Switcher Logic (Modal-style)
function toggleLangMenu(show) {
    const dropdown = document.querySelector('.lang-dropdown');
    let backdrop = document.querySelector('.lang-backdrop');

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'lang-backdrop';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', () => toggleLangMenu(false));
    }

    if (show) {
        // Ensure dropdown is moved to body so it's not trapped in footer stacking context
        if (dropdown && dropdown.parentElement !== document.body) {
            document.body.appendChild(dropdown);
        }
        dropdown.style.display = 'grid';
        backdrop.style.display = 'block';
        setTimeout(() => {
            dropdown.classList.add('show');
            backdrop.classList.add('show');
            document.body.style.overflow = 'hidden';
        }, 10);
    } else {
        dropdown.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!dropdown.classList.contains('show')) {
                dropdown.style.display = 'none';
                backdrop.style.display = 'none';
            }
        }, 300);
    }
}

document.addEventListener('click', function (event) {
    const langBtn = event.target.closest('.lang-btn');
    const langLink = event.target.closest('.lang-dropdown-link');
    const isClickInsideDropdown = event.target.closest('.lang-dropdown');
    const dropdown = document.querySelector('.lang-dropdown');

    if (langLink) {
        let href = langLink.getAttribute('href') || '/';
        let lang = 'en';
        const match = href.match(/^\/([a-z]{2})\//);
        if (match) {
            lang = match[1];
        } else if (href === '/') {
            lang = 'en';
        }
        setLang(lang);
    }

    if (langBtn) {
        const isShow = dropdown.classList.contains('show');
        toggleLangMenu(!isShow);
    } else if (!isClickInsideDropdown && dropdown.classList.contains('show')) {
        toggleLangMenu(false);
    }
});

// Contact Form Logic
function handleContactSubmit(event) {
    event.preventDefault();

    var form = event.target;
    var btn = form.querySelector('button[type="submit"]');
    var originalText = btn.innerText;

    btn.innerText = "...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    var firstName = form.querySelector('#first_name').value;
    var lastName = form.querySelector('#last_name').value;
    var phone = form.querySelector('#phone').value || '';
    var email = form.querySelector('#email').value;
    var message = form.querySelector('#message').value;
    var honeypot = form.querySelector('#honeypot').value;

    // Honeypot check for bots
    if (honeypot) {
        console.log("Honeypot detected. Submission ignored.");
        return;
    }

    // Basic Phone Validation
    if (phone && !/^\+?[\d\s\-]{7,}$/.test(phone)) {
        alert("Please enter a valid phone number.");
        btn.innerText = originalText;
        btn.style.opacity = "1";
        btn.disabled = false;
        return;
    }

    fetch("https://formsubmit.co/ajax/i@aBest.co", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name: `${firstName} ${lastName}`,
            phone: phone,
            email: email,
            message: message
        })
    })
        .then(response => response.json())
        .then(data => {
            btn.innerText = "✓";
            btn.style.background = "rgba(40, 167, 69, 0.4)";

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = "";
                btn.style.opacity = "1";
                btn.disabled = false;
                form.reset();
            }, 4000);
        })
        .catch(error => {
            btn.innerText = "Error";
            btn.style.background = "rgba(220, 53, 69, 0.4)";

            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = "";
                btn.style.opacity = "1";
                btn.disabled = false;
            }, 4000);
        });
}

function getContactFormHTML(lang) {
    const translations = {
        de: {
            title: "Kontakt",
            desc: "Wir freuen uns über partnerschaftliche und investitionsbezogene Anfragen.",
            firstName: "Vorname",
            lastName: "Nachname",
            phone: "Telefonnummer",
            email: "E-Mail",
            message: "Nachricht",
            submit: "Nachricht Senden"
        },
        en: {
            title: "Contact",
            desc: "We welcome partnership and investment-related inquiries.",
            firstName: "First Name",
            lastName: "Last Name",
            phone: "Phone Number",
            email: "Email",
            message: "Message",
            submit: "Send Message"
        },
        tr: {
            title: "İletişim",
            desc: "Ortaklık ve yatırım taleplerini memnuniyetle karşılıyoruz.",
            firstName: "Ad",
            lastName: "Soyad",
            phone: "Telefon",
            email: "E-posta",
            message: "Mesaj",
            submit: "Mesaj Gönder"
        },
        es: {
            title: "Contacto",
            desc: "Agradecemos las consultas relacionadas con asociaciones e inversiones.",
            firstName: "Nombre",
            lastName: "Apellido",
            phone: "Teléfono",
            email: "Correo electrónico",
            message: "Mensaje",
            submit: "Enviar mensaje"
        },
        fr: {
            title: "Contact",
            desc: "Nous accueillons les demandes liées aux partenariats et aux investissements.",
            firstName: "Prénom",
            lastName: "Nom",
            phone: "Téléphone",
            email: "E-mail",
            message: "Message",
            submit: "Envoyer le message"
        }
        // Add more languages as needed, default to en
    };

    const t = translations[lang] || translations['en'];

    return `
        <div class="text-center">
            <h2>${t.title}</h2>
            <div class="divider mt-2"></div>
            <p style="margin-bottom: 1.5rem;">${t.desc}</p>
            <form class="glass-form" id="contact-form-modal" onsubmit="handleContactSubmit(event)">
                <div class="form-row" style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group" style="flex: 1; text-align: left;">
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.firstName}</label>
                        <input class="form-input" id="first_name" required="" type="text" style="width: 100%;" />
                    </div>
                    <div class="form-group" style="flex: 1; text-align: left;">
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.lastName}</label>
                        <input class="form-input" id="last_name" required="" type="text" style="width: 100%;" />
                    </div>
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.phone}</label>
                    <input class="form-input" id="phone" type="tel" style="width: 100%;" />
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.email}</label>
                    <input class="form-input" id="email" required="" type="email" style="width: 100%;" />
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.message}</label>
                    <textarea class="form-textarea" id="message" required=""
                        style="resize: none; overflow: hidden; min-height: 120px; width: 100%;"></textarea>
                </div>
                <button class="glass-button ripple" style="width: 100%; padding: 14px; margin-top: 10px;"
                    type="submit">${t.submit}</button>
                <div style="display:none;"><label>Leave this field empty</label><input id="honeypot"
                        name="_honeypot" type="text" /></div>
            </form>
        </div>
    `;
}

function getAuthFormHTML(lang) {
    const translations = {
        de: {
            loginTab: "Login",
            regTab: "Registrierung",
            email: "E-Mail",
            password: "Passwort",
            loginBtn: "Anmelden",
            regBtn: "Registrieren",
            googleBtn: "Mit Google anmelden",
            or: "oder"
        },
        en: {
            loginTab: "Login",
            regTab: "Register",
            email: "Email",
            password: "Password",
            loginBtn: "Sign In",
            regBtn: "Sign Up",
            googleBtn: "Continue with Google",
            or: "or"
        },
        tr: {
            loginTab: "Giriş",
            regTab: "Kaydol",
            email: "E-posta",
            password: "Şifre",
            loginBtn: "Giriş Yap",
            regBtn: "Kayıt Ol",
            googleBtn: "Google ile devam et",
            or: "veya"
        },
        es: {
            loginTab: "Acceso",
            regTab: "Registro",
            email: "Correo",
            password: "Contraseña",
            loginBtn: "Iniciar sesión",
            regBtn: "Registrarse",
            googleBtn: "Continuar con Google",
            or: "o"
        },
        fr: {
            loginTab: "Connexion",
            regTab: "Inscription",
            email: "E-mail",
            password: "Mot de passe",
            loginBtn: "Se connecter",
            regBtn: "S'inscrire",
            googleBtn: "Continuer avec Google",
            or: "ou"
        }
    };

    const t = translations[lang] || translations['en'];

    return `
        <div class="auth-modal-wrapper text-center">
            <div class="auth-tabs">
                <button class="auth-tab active" id="tab-login">${t.loginTab}</button>
                <button class="auth-tab" id="tab-register">${t.regTab}</button>
            </div>
            
            <div class="divider mt-2 mb-2"></div>
            
            <!-- Login Form -->
            <form class="glass-form auth-form-content" id="login-form-content" style="display: block;" onsubmit="handleAuthSubmit(event, 'login')">
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.email}</label>
                    <input class="form-input" id="login_email" required type="email" style="width: 100%;" />
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.password}</label>
                    <input class="form-input" id="login_password" required type="password" style="width: 100%;" />
                </div>
                <button class="glass-button ripple" style="width: 100%; padding: 12px; margin-top: 5px;" type="submit">${t.loginBtn}</button>
            </form>
            
            <!-- Register Form -->
            <form class="glass-form auth-form-content" id="register-form-content" style="display: none;" onsubmit="return handleAuthSubmit(event, '/api/auth/register', '/${lang}/profil.html')">
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.email}</label>
                    <input class="form-input" id="reg_email" required type="email" style="width: 100%;" />
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.password}</label>
                    <input class="form-input" id="reg_password" required type="password" style="width: 100%;" />
                </div>
                <button class="glass-button ripple" style="width: 100%; padding: 12px; margin-top: 5px;" type="submit">${t.regBtn}</button>
            </form>
            
            <div class="auth-separator">
                <span>${t.or}</span>
            </div>
            
            <div id="g_id_onload"
                 data-client_id="660480949703-vmvtk8kqp6ueb1o8k0tui860mjmdm0n6.apps.googleusercontent.com"
                 data-context="signin"
                 data-ux_mode="popup"
                 data-callback="handleGoogleSignIn"
                 data-auto_prompt="false">
            </div>

            <div class="g_id_signin"
                 data-type="standard"
                 data-shape="rectangular"
                 data-theme="outline"
                 data-text="continue_with"
                 data-size="large"
                 data-logo_alignment="left"
                 style="display: flex; justify-content: center; margin-top: 10px;">
            </div>
        </div>
    `;
}

// Auth Submit Logic
async function handleAuthSubmit(event, endpoint, redirectUrl) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;

    btn.innerText = '...';
    btn.disabled = true;

    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            btn.innerText = '✓';
            if (data.token) {
                localStorage.setItem('aBest_session', data.token);
                window.location.href = redirectUrl;
            } else {
                // This branch should ideally not be hit if token is always returned on success
                alert('Erfolgreich, aber kein Token erhalten. Bitte versuchen Sie sich anzumelden.');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } else {
            alert(data.error || 'Authentifizierung fehlgeschlagen');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        console.error('Auth error', err);
        alert('Ein Netzwerkfehler ist aufgetreten.');
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Google Sign In Callback
window.handleGoogleSignIn = async function (response) {
    if (response.credential) {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('aBest_session', data.token);
                const lang = document.documentElement.lang || 'en';
                window.location.href = `/${lang}/profil.html`;
            } else {
                alert('Google Sign-In fehlgeschlagen: ' + (data.error || 'Unbekannter Fehler'));
            }
        } catch (err) {
            console.error('Google Sign-In Error:', err);
            alert('Netzwerkfehler beim Google Login.');
        }
    }
}

window.logout = function () {
    localStorage.removeItem('aBest_session');
    const lang = document.documentElement.lang || 'en';
    window.location.href = `/${lang}/`;
};

// --- PROFILE PAGE LOGIC ---
if (window.location.pathname.includes('/profil.html')) {
    loadUserProfile();
}

// Global functions for profile page
window.loadUserProfile = async function () {
    const token = localStorage.getItem('aBest_session');
    if (!token) {
        const lang = document.documentElement.lang || 'en';
        window.location.href = `/${lang}/`;
        return;
    }

    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            window.logout();
            return;
        }

        if (!res.ok) throw new Error('Profil konnte nicht geladen werden.');

        const profile = await res.json();

        // Populate fields
        const emailField = document.getElementById('profile-email');
        const nameField = document.getElementById('profile-name');
        const phoneField = document.getElementById('profile-phone');
        const companyField = document.getElementById('profile-company');
        const adminBtn = document.getElementById('profile-admin-btn');
        const userAvatarLetters = document.getElementById('profile-avatar-letters');

        if (emailField) emailField.value = profile.email || '';
        if (nameField) nameField.value = profile.name || '';
        if (phoneField) phoneField.value = profile.phone || '';
        if (companyField) companyField.value = profile.company || '';

        // Show superadmin button if user is admin
        if (profile.role === 'Admin' || profile.role === 'Superadmin') {
            if (adminBtn) adminBtn.style.display = 'inline-block';
        }

        // Set avatar letters
        if (userAvatarLetters) {
            const nameStr = profile.name || profile.email;
            userAvatarLetters.innerText = nameStr.substring(0, 2).toUpperCase();
        }

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

window.saveUserProfile = async function (event) {
    event.preventDefault();
    const token = localStorage.getItem('aBest_session');
    if (!token) return;

    const name = document.getElementById('profile-name').value;
    const phone = document.getElementById('profile-phone').value;
    const company = document.getElementById('profile-company').value;
    const saveBtn = document.getElementById('profile-save-btn');

    if (saveBtn) saveBtn.innerText = 'Speichert...';

    try {
        const res = await fetch('/api/auth/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, phone, company })
        });

        if (res.ok) {
            alert('Profil erfolgreich aktualisiert.');
            loadUserProfile(); // refresh avatar
        } else {
            alert('Fehler beim Speichern.');
        }
    } catch (err) {
        console.error(err);
        alert('Netzwerkfehler beim Speichern.');
    } finally {
        if (saveBtn) saveBtn.innerText = 'Änderungen speichern';
    }
};

// 7. OpenStreetMap Initialization (Leaflet + Nominatim Geocoding)
const osmMaps = document.querySelectorAll('.osm-map');

if (osmMaps.length > 0 && typeof L !== 'undefined') {
    osmMaps.forEach(mapDiv => {
        const query = mapDiv.getAttribute('data-query');
        if (!query) return;

        // Free OSM Nominatim API to get coordinates from the query string
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const lat = data[0].lat;
                    const lon = data[0].lon;

                    // Initialize Leaflet map
                    const map = L.map(mapDiv, {
                        zoomControl: false // optional, gives a cleaner look like the google map embed
                    }).setView([lat, lon], 12);

                    // Use standard OSM tiles
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(map);

                    // Add a pin/marker
                    L.marker([lat, lon]).addTo(map);

                    // EXPERT: Remove skeleton and show map
                    mapDiv.classList.add('loaded');
                    const skeleton = mapDiv.parentElement.querySelector('.map-skeleton');
                    if (skeleton) skeleton.style.display = 'none';

                    // Optionally add zoom controls manually if you want them styled differently
                    L.control.zoom({
                        position: 'bottomright'
                    }).addTo(map);
                } else {
                    console.error('Nominatim found no results for:', query);
                    const skeleton = mapDiv.parentElement.querySelector('.map-skeleton');
                    if (skeleton) skeleton.innerHTML = '<p style="text-align:center; padding-top:180px;">Map location not found.</p>';
                }
            })
            .catch(err => {
                console.error('Error fetching map data:', err);
                const skeleton = mapDiv.parentElement.querySelector('.map-skeleton');
                if (skeleton) skeleton.innerHTML = '<p style="text-align:center; padding-top:180px;">Map data could not be retrieved.</p>';
            });

    });
}

// 8. Auto-expanding Textarea for Contact Form
const contactTextarea = document.querySelector('#message');
if (contactTextarea) {
    contactTextarea.addEventListener('input', function () {
        // Reset height locally to shrink if user deletes text
        this.style.height = '120px';
        // Set new height based on scrollHeight, padding etc.
        this.style.height = (this.scrollHeight) + 'px';
    });
}
