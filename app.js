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
        threshold: 0
    };

    const animateOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate only once
            }
        });
    }, observerOptions);

    // Initial load animations
    // Elements already in viewport on load get 'visible' immediately (no blank flash)
    const viewportHeight = window.innerHeight;
    document.querySelectorAll('.fade-in-up').forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < viewportHeight && rect.bottom >= 0) {
            // Above-the-fold: animate in immediately with short stagger
            el.style.transitionDelay = `${index * 0.1}s`;
            requestAnimationFrame(() => el.classList.add('visible'));
        } else {
            // Below-the-fold: use scroll observer
            el.style.transitionDelay = `${index * 0.15}s`;
            animateOnScroll.observe(el);
        }
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
            const escText = (str) => { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; };
            const escAttr = (str) => str.replace(/[&"'<>]/g, c => ({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c]));
            const projectTitle = document.querySelector('.featured-header h3')?.innerText || '';
            const projectTags = document.querySelector('.project-tags')?.innerText || '';
            const projectImg = document.querySelector('.image-preview img')?.src || '';

            const content = `
                <img src="${escAttr(projectImg)}" alt="${escAttr(projectTitle)}" style="width:100%; border-radius:16px; margin-bottom:1.5rem;">
                <h2 style="margin-bottom:0.5rem;">${escText(projectTitle)}</h2>
                <p style="color:var(--text-accent); margin-bottom:1rem;">${escText(projectTags)}</p>
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
            // Use the new browser route instead of modal
            e.preventDefault();
            window.location.href = '/login';
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
        if (sessionToken) {
            window.location.href = '/profile';
            return;
        }
        window.location.href = `/${lang}/login`;
    }

    // Check initial auth state to update icon
    checkAuthState();

    // 7. Page-level Auth Injection (for /login and /register routes)
    const authTarget = document.getElementById('auth-content-target');
    const loginLink = document.querySelector('a[href="/login"], a[href="/admin/"]');
    const profileLink = document.getElementById('profile-btn');

    if (authTarget) {
        // Highlight login icon if on login/register page
        if (loginLink) loginLink.classList.add('active');

        const lang = document.documentElement.lang || 'en';
        const pathname = window.location.pathname;

        authTarget.innerHTML = getAuthFormHTML(lang);

        const loginTab = document.getElementById('tab-login');
        const regTab = document.getElementById('tab-register');
        const loginForm = document.getElementById('login-form-content');
        const regForm = document.getElementById('register-form-content');

        if (pathname === '/register') {
            if (regTab) regTab.click();
            document.title = "aBest.co | Register";
        } else {
            if (loginTab) loginTab.click();
            document.title = "aBest.co | Login";
        }

        // Re-attach listeners for tab switching (since we replaced innerHTML)
        if (loginTab && regTab && loginForm && regForm) {
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active');
                regTab.classList.remove('active');
                loginForm.style.display = 'block';
                regForm.style.display = 'none';
                history.pushState(null, '', '/login');
            });
            regTab.addEventListener('click', () => {
                regTab.classList.add('active');
                loginTab.classList.remove('active');
                regForm.style.display = 'block';
                loginForm.style.display = 'none';
                history.pushState(null, '', '/register');
            });
        }
    } else if (window.location.pathname === '/profile') {
        if (profileLink) profileLink.classList.add('active');
    }
});

function checkAuthState() {
    const sessionToken = localStorage.getItem('aBest_session');
    // Target the login icon in the header
    const loginLink = document.querySelector('a[href="/login"], a[href*="/login"]');
    if (sessionToken && loginLink) {
        loginLink.href = '/profile';
        loginLink.setAttribute('aria-label', 'Mein Profil');
        // Filled user icon = logged in
        loginLink.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="currentColor">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
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

    if (!dropdown) return;

    if (show) {
        // Ensure dropdown is moved to body so it's not trapped in footer stacking context
        if (dropdown.parentElement !== document.body) {
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
        const isShow = dropdown && dropdown.classList.contains('show');
        toggleLangMenu(!isShow);
    } else if (!isClickInsideDropdown && dropdown && dropdown.classList.contains('show')) {
        toggleLangMenu(false);
    }
});

// Contact Form Logic
function handleContactSubmit(event) {
    event.preventDefault();

    var form = event.target;
    var btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
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

    fetch("/api/contact", {
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
            name: "Vor- und Nachname",
            email: "E-Mail",
            password: "Passwort",
            confirmPassword: "Passwort bestätigen",
            loginBtn: "Anmelden",
            regBtn: "Konto erstellen",
            forgotPassword: "Passwort vergessen?",
            pwMismatch: "Die Passwörter stimmen nicht überein.",
            googleBtn: "Mit Google fortfahren"
        },
        en: {
            loginTab: "Login",
            regTab: "Register",
            name: "Full Name",
            email: "Email",
            password: "Password",
            confirmPassword: "Confirm Password",
            loginBtn: "Sign In",
            regBtn: "Create Account",
            forgotPassword: "Forgot password?",
            pwMismatch: "Passwords do not match.",
            googleBtn: "Continue with Google"
        },
        tr: {
            loginTab: "Giriş",
            regTab: "Kaydol",
            name: "Ad Soyad",
            email: "E-posta",
            password: "Şifre",
            confirmPassword: "Şifreyi Onayla",
            loginBtn: "Giriş Yap",
            regBtn: "Hesap Oluştur",
            forgotPassword: "Şifremi unuttum?",
            pwMismatch: "Şifreler eşleşmiyor.",
            googleBtn: "Google ile devam et"
        },
        es: {
            loginTab: "Acceso",
            regTab: "Registro",
            name: "Nombre completo",
            email: "Correo",
            password: "Contraseña",
            confirmPassword: "Confirmar contraseña",
            loginBtn: "Iniciar sesión",
            regBtn: "Crear cuenta",
            forgotPassword: "¿Olvidaste tu contraseña?",
            pwMismatch: "Las contraseñas no coinciden.",
            googleBtn: "Continuar con Google"
        },
        fr: {
            loginTab: "Connexion",
            regTab: "Inscription",
            name: "Nom complet",
            email: "E-mail",
            password: "Mot de passe",
            confirmPassword: "Confirmer le mot de passe",
            loginBtn: "Se connecter",
            regBtn: "Créer un compte",
            forgotPassword: "Mot de passe oublié ?",
            pwMismatch: "Les mots de passe ne correspondent pas.",
            googleBtn: "Continuer avec Google"
        },
        zh: {
            loginTab: "登录",
            regTab: "注册",
            name: "姓名",
            email: "电子邮箱",
            password: "密码",
            confirmPassword: "确认密码",
            loginBtn: "登录",
            regBtn: "创建账户",
            forgotPassword: "忘记密码？",
            pwMismatch: "两次输入的密码不一致。",
            googleBtn: "使用 Google 继续"
        },
        hi: {
            loginTab: "लॉगिन",
            regTab: "पंजीकरण",
            name: "पूरा नाम",
            email: "ईमेल",
            password: "पासवर्ड",
            confirmPassword: "पासवर्ड की पुष्टि करें",
            loginBtn: "साइन इन करें",
            regBtn: "खाता बनाएं",
            forgotPassword: "पासवर्ड भूल गए?",
            pwMismatch: "पासवर्ड मेल नहीं खाते।",
            googleBtn: "Google के साथ जारी रखें"
        },
        ar: {
            loginTab: "تسجيل الدخول",
            regTab: "إنشاء حساب",
            name: "الاسم الكامل",
            email: "البريد الإلكتروني",
            password: "كلمة المرور",
            confirmPassword: "تأكيد كلمة المرور",
            loginBtn: "تسجيل الدخول",
            regBtn: "إنشاء حساب",
            forgotPassword: "نسيت كلمة المرور؟",
            pwMismatch: "كلمتا المرور غير متطابقتين.",
            googleBtn: "المتابعة مع Google"
        },
        ru: {
            loginTab: "Вход",
            regTab: "Регистрация",
            name: "Полное имя",
            email: "Эл. почта",
            password: "Пароль",
            confirmPassword: "Подтвердите пароль",
            loginBtn: "Войти",
            regBtn: "Создать аккаунт",
            forgotPassword: "Забыли пароль?",
            pwMismatch: "Пароли не совпадают.",
            googleBtn: "Продолжить с Google"
        },
        pt: {
            loginTab: "Entrar",
            regTab: "Registar",
            name: "Nome completo",
            email: "E-mail",
            password: "Senha",
            confirmPassword: "Confirmar senha",
            loginBtn: "Entrar",
            regBtn: "Criar conta",
            forgotPassword: "Esqueceu a senha?",
            pwMismatch: "As senhas não coincidem.",
            googleBtn: "Continuar com o Google"
        },
        ur: {
            loginTab: "لاگ ان",
            regTab: "رجسٹر",
            name: "پورا نام",
            email: "ای میل",
            password: "پاس ورڈ",
            confirmPassword: "پاس ورڈ کی تصدیق کریں",
            loginBtn: "سائن ان کریں",
            regBtn: "اکاؤنٹ بنائیں",
            forgotPassword: "پاس ورڈ بھول گئے؟",
            pwMismatch: "پاس ورڈ مماثل نہیں ہیں۔",
            googleBtn: "Google کے ساتھ جاری رکھیں"
        },
        ku: {
            loginTab: "Têketin",
            regTab: "Tomar Bûn",
            name: "Navê Temam",
            email: "E-mail",
            password: "Şîfre",
            confirmPassword: "Şîfre Piştrast Bike",
            loginBtn: "Têkeve",
            regBtn: "Hesab Çêke",
            forgotPassword: "Şîfreya xwe ji bîr kir?",
            pwMismatch: "Şîfre hev nagirin.",
            googleBtn: "Bi Google Berdewam Bike"
        },
        he: {
            loginTab: "התחברות",
            regTab: "הרשמה",
            name: "שם מלא",
            email: "אימייל",
            password: "סיסמה",
            confirmPassword: "אמת סיסמה",
            loginBtn: "התחבר",
            regBtn: "צור חשבון",
            forgotPassword: "שכחת סיסמה?",
            pwMismatch: "הסיסמאות אינן תואמות.",
            googleBtn: "המשך עם Google"
        },
        hy: {
            loginTab: "Մուտք",
            regTab: "Գրանցում",
            name: "Լրիվ անուն",
            email: "Էլ. փոստ",
            password: "Գաղտնաբառ",
            confirmPassword: "Հաստատել գաղտնաբառը",
            loginBtn: "Մուտք գործել",
            regBtn: "Ստեղծել հաշիվ",
            forgotPassword: "Մոռացե՞լ եք գաղտնաբառը:",
            pwMismatch: "Գաղտնաբառերը չեն համընկնում։",
            googleBtn: "Շարունակել Google-ով"
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
            <form class="glass-form auth-form-content" id="login-form-content" style="display: block;" onsubmit="handleAuthSubmit(event, '/api/auth/login', '/profile')">
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.email}</label>
                    <input class="form-input" id="login_email" required type="email" style="width: 100%;" autocomplete="email" />
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 0.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.password}</label>
                    <input class="form-input" id="login_password" required type="password" style="width: 100%;" autocomplete="current-password" />
                </div>
                <div style="text-align: right; margin-bottom: 1rem;">
                    <a href="/de/kontakt.html" style="font-size: 0.8rem; color: var(--text-muted); text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary-blue)'" onmouseout="this.style.color='var(--text-muted)'">${t.forgotPassword}</a>
                </div>
                <button class="glass-button ripple" style="width: 100%; padding: 12px; margin-top: 5px;" type="submit">${t.loginBtn}</button>
            </form>

            <!-- Register Form -->
            <form class="glass-form auth-form-content" id="register-form-content" style="display: none;" onsubmit="return handleRegisterSubmit(event, '${t.pwMismatch}')">
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.name}</label>
                    <input class="form-input" id="reg_name" required type="text" style="width: 100%;" autocomplete="name" />
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.email}</label>
                    <input class="form-input" id="reg_email" required type="email" style="width: 100%;" autocomplete="email" />
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.password}</label>
                    <input class="form-input" id="reg_password" required type="password" style="width: 100%;" autocomplete="new-password" minlength="8" />
                </div>
                <div class="form-group" style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">${t.confirmPassword}</label>
                    <input class="form-input" id="reg_confirm" required type="password" style="width: 100%;" autocomplete="new-password" minlength="8" />
                </div>
                <button class="glass-button ripple" style="width: 100%; padding: 12px; margin-top: 5px;" type="submit">${t.regBtn}</button>
            </form>

            <div style="margin: 20px 0; border-top: 1px solid var(--glass-border);"></div>

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
                 style="display: flex; justify-content: center;">
            </div>
        </div>
    `;
}

// Register Submit — validates confirm-password, then calls API
async function handleRegisterSubmit(event, pwMismatchMsg) {
    event.preventDefault();
    const form = event.target;
    const pw = document.getElementById('reg_password').value;
    const confirm = document.getElementById('reg_confirm').value;
    if (pw !== confirm) {
        alert(pwMismatchMsg || 'Passwords do not match.');
        return false;
    }
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = '...';
    btn.disabled = true;
    const name = document.getElementById('reg_name').value.trim();
    const email = document.getElementById('reg_email').value.trim();
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pw })
        });
        const data = await response.json();
        if (response.ok) {
            btn.innerText = '✓';
            if (data.token) {
                localStorage.setItem('aBest_session', data.token);
                var _nextParamReg = new URLSearchParams(window.location.search).get('next');
                var _safeNextReg = (_nextParamReg && _nextParamReg.startsWith('/') && !_nextParamReg.startsWith('//')) ? _nextParamReg : '/profile';
                window.location.href = _safeNextReg;
            } else {
                alert('Registrierung erfolgreich. Bitte anmelden.');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        } else {
            alert(data.error || 'Registrierung fehlgeschlagen.');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        console.error('Register error', err);
        alert('Netzwerkfehler. Bitte erneut versuchen.');
        btn.innerText = originalText;
        btn.disabled = false;
    }
    return false;
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
                // Redirect to ?next= param if present and safe, otherwise default
                var _nextParam = new URLSearchParams(window.location.search).get('next');
                var _safeNext = (_nextParam && _nextParam.startsWith('/') && !_nextParam.startsWith('//')) ? _nextParam : redirectUrl;
                window.location.href = _safeNext;
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
                var _nextParamG = new URLSearchParams(window.location.search).get('next');
                var _safeNextG = (_nextParamG && _nextParamG.startsWith('/') && !_nextParamG.startsWith('//')) ? _nextParamG : '/profile';
                window.location.href = _safeNextG;
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
    window.location.href = `/${lang}/login`;
};

// --- PROFILE PAGE LOGIC ---
if (window.location.pathname.includes('/profil.html') || window.location.pathname.endsWith('/profile')) {
    loadUserProfile();
    loadMessages();
}

// Global functions for profile page
window.loadUserProfile = async function () {
    const token = localStorage.getItem('aBest_session');
    if (!token) {
        window.location.href = `/login`;
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

        // Set avatar: image if available, else initials
        if (userAvatarLetters) {
            const nameStr = profile.name || profile.email || '?';
            const initials = nameStr.split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase() || '?';
            const initialsEl = document.getElementById('avatar-initials');
            if (profile.avatar) {
                // Show uploaded photo
                if (initialsEl) initialsEl.style.display = 'none';
                let img = userAvatarLetters.querySelector('img');
                if (!img) { img = document.createElement('img'); userAvatarLetters.appendChild(img); }
                img.src = profile.avatar;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;inset:0;';
            } else {
                // Show initials
                if (initialsEl) { initialsEl.textContent = initials; initialsEl.style.display = ''; }
                else { userAvatarLetters.innerText = initials; }
            }
        }
        // Populate hero card
        const heroName = document.getElementById('hero-name');
        const heroEmail = document.getElementById('hero-email');
        const heroBadge = document.getElementById('hero-badge');
        if (heroName) heroName.textContent = profile.name || profile.email || '—';
        if (heroEmail) heroEmail.textContent = profile.email || '—';
        if (heroBadge) heroBadge.textContent = profile.role || 'Mitglied';

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

window.loadMessages = async function () {
    const token = localStorage.getItem('aBest_session');
    if (!token) return;
    const thread = document.getElementById('message-thread');
    if (!thread) return;

    // HTML-escape helper to prevent XSS
    const escapeHtml = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    try {
        const res = await fetch('/api/messages', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load messages');

        const messages = await res.json();

        if (messages.length === 0) {
            thread.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:30px 0;font-size:0.85rem;">Noch keine Nachrichten. Schreiben Sie uns!</div>';
        } else {
            thread.innerHTML = messages.map(msg => {
                const isUser = msg.sender === 'user';
                const align = isUser ? 'right' : 'left';
                const bg = isUser ? 'var(--primary-blue)' : 'rgba(255,255,255,0.1)';
                const date = new Date(msg.timestamp).toLocaleString();
                const safeText = escapeHtml(msg.text);
                return `<div style="text-align:${align};margin-bottom:10px;"><div style="display:inline-block;padding:10px 15px;border-radius:8px;background:${bg};max-width:80%;text-align:left;"><div style="font-size:0.8rem;color:rgba(255,255,255,0.7);margin-bottom:4px;">${isUser ? 'Sie' : 'aBest.co Support'} - ${date}</div><div>${safeText}</div></div></div>`;
            }).join('');
            thread.scrollTop = thread.scrollHeight;
        }
    } catch (err) {
        console.error('Error loading messages:', err.message);
    }
};

window.sendMessage = async function () {
    const token = localStorage.getItem('aBest_session');
    const input = document.getElementById('new-message-input');
    const btn = document.getElementById('send-message-btn');
    if (!token || !input || !input.value.trim()) return;

    const text = input.value.trim();
    const originalText = btn.innerText;
    btn.innerText = '...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });

        if (res.ok) {
            input.value = '';
            loadMessages();
        }
    } catch (err) {
        console.error('Error sending message:', err);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// 7. OpenStreetMap Initialization (Leaflet + hardcoded coords or Nominatim Geocoding)
const osmMaps = document.querySelectorAll('.osm-map');

function initLeafletMap(mapDiv, lat, lon, zoom) {
    zoom = zoom || 15;
    const map = L.map(mapDiv, { zoomControl: false }).setView([lat, lon], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.marker([lat, lon]).addTo(map);
    mapDiv.classList.add('loaded');
    const skeleton = mapDiv.parentElement.querySelector('.map-skeleton');
    if (skeleton) skeleton.style.display = 'none';
    L.control.zoom({ position: 'bottomright' }).addTo(map);
}

if (osmMaps.length > 0 && typeof L !== 'undefined') {
    osmMaps.forEach(mapDiv => {
        const lat = parseFloat(mapDiv.getAttribute('data-lat'));
        const lon = parseFloat(mapDiv.getAttribute('data-lon'));
        const zoom = parseInt(mapDiv.getAttribute('data-zoom')) || 15;

        // If exact coordinates are provided, use them directly (no geocoding needed)
        if (!isNaN(lat) && !isNaN(lon)) {
            initLeafletMap(mapDiv, lat, lon, zoom);
            return;
        }

        // Fallback: Nominatim geocoding from data-query
        const query = mapDiv.getAttribute('data-query');
        if (!query) return;

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    initLeafletMap(mapDiv, data[0].lat, data[0].lon, zoom);
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

// ===== COOKIE CONSENT BANNER =====
(function() {
    if (localStorage.getItem('abest_cookie_consent')) return;

    var lang = document.documentElement.lang || 'de';
    var texts = {
        de: {
            msg: 'Diese Website verwendet technisch notwendige Cookies sowie Analyse-Dienste (Cloudflare Analytics). Mit der Nutzung der Seite stimmen Sie dem zu.',
            accept: 'Akzeptieren',
            decline: 'Ablehnen',
            more: 'Mehr erfahren'
        },
        en: {
            msg: 'This website uses essential cookies and analytics services (Cloudflare Analytics). By using this site, you agree to their use.',
            accept: 'Accept',
            decline: 'Decline',
            more: 'Learn more'
        }
    };
    var t = texts[lang] || texts['en'];
    var cookiePolicyPath = '/' + lang + '/cookie-policy.html';

    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie Consent');
    banner.style.cssText = [
        'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:99999',
        'background:rgba(10,12,20,0.97)', 'backdrop-filter:blur(16px)',
        'border-top:1px solid rgba(255,255,255,0.12)',
        'padding:16px 20px', 'display:flex', 'flex-wrap:wrap',
        'align-items:center', 'gap:12px', 'font-family:inherit',
        'box-shadow:0 -4px 24px rgba(0,0,0,0.5)'
    ].join(';');

    banner.innerHTML = '<p style="margin:0;flex:1;min-width:200px;font-size:0.82rem;color:rgba(255,255,255,0.75);line-height:1.5;">' + t.msg + ' <a href="' + cookiePolicyPath + '" style="color:#4d9fff;text-decoration:underline;">' + t.more + '</a></p>' +
        '<div style="display:flex;gap:8px;flex-shrink:0;">' +
        '<button id="cookie-decline" style="background:transparent;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-family:inherit;">' + t.decline + '</button>' +
        '<button id="cookie-accept" style="background:rgba(77,159,255,0.25);border:1px solid rgba(77,159,255,0.5);color:#fff;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:500;font-family:inherit;">' + t.accept + '</button>' +
        '</div>';

    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', function() {
        localStorage.setItem('abest_cookie_consent', 'accepted');
        banner.remove();
    });
    document.getElementById('cookie-decline').addEventListener('click', function() {
        localStorage.setItem('abest_cookie_consent', 'declined');
        banner.remove();
    });
})();

// ══════════════════════════════════════════════════════════════════
// aBest.co INTELLIGENCE ENGINE
// Watch-Time-Tracking → Score-Berechnung → Personalisierter Feed
// SEO · AIO · GEO · AEO · KI-Optimierung
// ══════════════════════════════════════════════════════════════════
(function() {
    'use strict';

    // ── Config ────────────────────────────────────────────────────
    const STORAGE_KEY   = 'abest_behavior';
    const HALF_LIFE     = 7;   // days — score halbiert sich nach 7 Tagen
    const LAMBDA        = Math.LN2 / HALF_LIFE;
    const MAX_EVENTS    = 100;
    const SYNC_DEBOUNCE = 3000; // ms

    // Page → Category Mapping
    const PAGE_MAP = [
        { pattern: '/earn-money/capital-partner', role: 'capital-partner', weight: 1.2 },
        { pattern: '/earn-money/founder',         role: 'founder',         weight: 1.2 },
        { pattern: '/earn-money/investor',        role: 'investor',        weight: 1.2 },
        { pattern: '/earn-money/business',        role: 'business',        weight: 1.2 },
        { pattern: '/earn-money/seller',          role: 'seller',          weight: 1.2 },
        { pattern: '/earn-money/explorer',        role: 'explorer',        weight: 1.2 },
        { pattern: '/earn-money',                 role: 'general',         weight: 0.6 },
        { pattern: '/ideen',                      role: 'general',         weight: 0.6 },
        { pattern: '/usa/california',             country: 'usa',          weight: 1.5 },
        { pattern: '/usa',                        country: 'usa',          weight: 1.0 },
        { pattern: '/deutschland/berlin',         country: 'de',           weight: 1.5 },
        { pattern: '/deutschland',                country: 'de',           weight: 1.0 },
        { pattern: '/turkiye/antalya',            country: 'tr',           weight: 1.5 },
        { pattern: '/turkiye/gaziantep',          country: 'tr',           weight: 1.5 },
        { pattern: '/turkiye/istanbul',           country: 'tr',           weight: 1.5 },
        { pattern: '/turkiye',                    country: 'tr',           weight: 1.0 },
        { pattern: '/partnerschaften',            action:  'partner',      weight: 0.8 },
        { pattern: '/kontakt',                    action:  'contact',      weight: 0.8 },
    ];

    // ── Helpers ───────────────────────────────────────────────────
    function detectCategory(path) {
        const clean = path.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';
        for (const m of PAGE_MAP) {
            if (clean === m.pattern || clean.startsWith(m.pattern + '/')) return m;
        }
        return null;
    }

    function timeScore(secs) {
        if (secs <  5) return 0;
        if (secs < 15) return 1;
        if (secs < 30) return 3;
        if (secs < 60) return 5;
        if (secs < 120) return 8;
        return 10;
    }

    function scrollMult(pct) {
        if (pct < 25) return 0.5;
        if (pct < 50) return 0.75;
        if (pct < 75) return 1.0;
        return 1.25;
    }

    function decayFactor(isoDate) {
        const ageDays = (Date.now() - new Date(isoDate).getTime()) / 86400000;
        return Math.exp(-LAMBDA * ageDays);
    }

    // ── Storage ───────────────────────────────────────────────────
    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { scores: {}, events: [] }; }
        catch { return { scores: {}, events: [] }; }
    }
    function save(d) {
        try { d.lastUpdated = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
        catch {}
    }

    // ── Score Writer ──────────────────────────────────────────────
    function bump(key, pts) {
        const d = load();
        if (!d.scores[key]) d.scores[key] = { score: 0, lastSeen: new Date().toISOString(), count: 0 };
        d.scores[key].score   += pts;
        d.scores[key].lastSeen = new Date().toISOString();
        d.scores[key].count++;
        save(d);
    }

    function recordSession(cat, secs, scrollPct) {
        const pts = timeScore(secs) * scrollMult(scrollPct) * (cat.weight || 1);
        if (pts === 0) return;
        const now = new Date().toISOString();
        const d   = load();
        if (cat.country) { if (!d.scores['c_' + cat.country]) d.scores['c_' + cat.country] = { score: 0, lastSeen: now, count: 0 }; d.scores['c_' + cat.country].score += pts; d.scores['c_' + cat.country].lastSeen = now; d.scores['c_' + cat.country].count++; }
        if (cat.role)    { if (!d.scores['r_' + cat.role])    d.scores['r_' + cat.role]    = { score: 0, lastSeen: now, count: 0 }; d.scores['r_' + cat.role].score    += pts; d.scores['r_' + cat.role].lastSeen    = now; d.scores['r_' + cat.role].count++;    }
        if (cat.action)  { if (!d.scores['a_' + cat.action])  d.scores['a_' + cat.action]  = { score: 0, lastSeen: now, count: 0 }; d.scores['a_' + cat.action].score  += pts; d.scores['a_' + cat.action].lastSeen  = now; d.scores['a_' + cat.action].count++;  }
        d.events = (d.events || []).slice(-(MAX_EVENTS - 1));
        d.events.push({ p: window.location.pathname, t: Math.round(secs), s: Math.round(scrollPct), ts: now });
        save(d);
        _syncToServer(d);
    }

    // ── Server Sync (logged-in users) ─────────────────────────────
    let _syncTimer = null;
    function _syncToServer(d) {
        clearTimeout(_syncTimer);
        _syncTimer = setTimeout(async function() {
            try {
                const ck = document.cookie.match(/abest_token=([^;]+)/);
                if (!ck) return;
                await fetch('/api/behavior', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ck[1] },
                    body: JSON.stringify({ scores: d.scores })
                });
            } catch {}
        }, SYNC_DEBOUNCE);
    }

    // ── Public API ────────────────────────────────────────────────
    // Returns decayed scores sorted by relevance
    window.abestScores = function() {
        const d = load();
        return Object.entries(d.scores || {}).map(function([k, v]) {
            return { key: k, score: v.score * decayFactor(v.lastSeen), raw: v.score, count: v.count, lastSeen: v.lastSeen };
        }).sort(function(a, b) { return b.score - a.score; });
    };

    // Returns ordered country keys: ['usa', 'de', 'tr'] by interest
    window.abestCountryOrder = function() {
        const defaults = ['usa', 'de', 'tr'];
        const sc = load().scores || {};
        return defaults.slice().sort(function(a, b) {
            const sA = (sc['c_' + a] || { score: 0, lastSeen: new Date().toISOString() });
            const sB = (sc['c_' + b] || { score: 0, lastSeen: new Date().toISOString() });
            return (sB.score * decayFactor(sB.lastSeen)) - (sA.score * decayFactor(sA.lastSeen));
        });
    };

    // Returns top role interest (or null)
    window.abestTopRole = function() {
        const scores = window.abestScores().filter(function(s) { return s.key.startsWith('r_'); });
        return scores.length > 0 ? scores[0].key.replace('r_', '') : null;
    };

    // Track explicit action (form open, button click)
    window.abestTrackAction = function(actionType, pts) {
        bump('a_' + actionType, pts || 2);
    };

    // Track role card click on earn-money page
    window.abestTrackRole = function(role) {
        bump('r_' + role, 2);
    };

    // ── Page Tracker ──────────────────────────────────────────────
    const _cat   = detectCategory(window.location.pathname);
    let _start   = Date.now();
    let _scroll  = 0;
    let _active  = true;

    if (_cat) {
        window.addEventListener('scroll', function() {
            const total = document.documentElement.scrollHeight - window.innerHeight;
            if (total > 0) _scroll = Math.max(_scroll, Math.round((window.scrollY / total) * 100));
        }, { passive: true });

        function _onLeave() {
            if (!_active) return;
            _active = false;
            recordSession(_cat, Math.round((Date.now() - _start) / 1000), _scroll);
        }

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) { _onLeave(); }
            else { _active = true; _start = Date.now(); _scroll = 0; }
        });
        window.addEventListener('pagehide', _onLeave);
    }

    // ── Homepage Personalization ──────────────────────────────────
    document.addEventListener('DOMContentLoaded', function() {
        var section = document.querySelector('.countries');
        if (!section) return;
        var cards = Array.from(section.querySelectorAll('a[href]'));
        if (cards.length < 2) return;

        var order  = window.abestCountryOrder();
        var scored = load().scores || {};
        var hasData = Object.keys(scored).some(function(k) { return k.startsWith('c_'); });
        if (!hasData) return; // No personalization for new visitors

        var mapped = { 'usa': null, 'de': null, 'tr': null };
        cards.forEach(function(card) {
            var href = card.getAttribute('href') || '';
            if (href.includes('/usa')) mapped['usa'] = card;
            else if (href.includes('/deutschland')) mapped['de'] = card;
            else if (href.includes('/turkiye')) mapped['tr'] = card;
        });

        // Show personalization badge on top card
        var topCountry = order[0];
        var topCard = mapped[topCountry];
        if (topCard && topCard !== cards[0]) {
            var badge = document.createElement('div');
            badge.style.cssText = 'position:absolute;top:10px;right:10px;background:rgba(77,159,255,0.85);color:#fff;font-size:10px;font-weight:600;padding:3px 8px;border-radius:20px;z-index:10;letter-spacing:0.04em;';
            badge.textContent = '★ Für Sie';
            topCard.style.position = 'relative';
            topCard.appendChild(badge);

            // Reorder DOM
            order.forEach(function(country) {
                var el = mapped[country];
                if (el) section.appendChild(el);
            });
        }
    });

})(); // END aBest Intelligence Engine

// ══════════════════════════════════════════════════════════════════
// aBest.co PWA ENGINE
// Service Worker · Browser-native Install (kein Custom-Banner)
// ══════════════════════════════════════════════════════════════════
(function() {
    'use strict';

    // ── 1. Service Worker registrieren ─────────────────────────────────────
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
                .catch(function() { /* silent fail */ });
        });
    }

    // ── 2. beforeinstallprompt: NICHT verhindern → Browser zeigt nativen Prompt ──
    // Kein e.preventDefault() → Browser-eigener Install-Hinweis erscheint (unten im Browser)
    window.addEventListener('beforeinstallprompt', function(/* e */) {
        // Intentionally do nothing – let the browser handle install natively
    });

})(); // END PWA ENGINE


// ══════════════════════════════════════════════════════════════════
// aBest.co GEO ENGINE
// Automatische Sprach- und Standorterkennung
// Sprachvorschlag-Banner + manuelle Auswahl über bestehendes Dropdown
// ══════════════════════════════════════════════════════════════════
(function() {
    'use strict';

    var SUPPORTED = ["en","de","tr","es","zh","hi","ar","fr","ru","pt","ur","ku","he","hy"];

    var LANG_NAMES = {
        en:'English', de:'Deutsch', tr:'Türkçe', es:'Español',
        zh:'中文', hi:'हिन्दी', ar:'العربية', fr:'Français',
        ru:'Русский', pt:'Português', ur:'اردو', ku:'Kurdî',
        he:'עברית', hy:'Հայերեն'
    };

    // Land → Sprache (primäre Landessprache)
    var COUNTRY_LANG = {
        DE:'de', AT:'de', CH:'de', LI:'de',
        US:'en', GB:'en', AU:'en', CA:'en', NZ:'en', IE:'en', ZA:'en',
        TR:'tr',
        ES:'es', MX:'es', AR:'es', CO:'es', CL:'es', PE:'es', VE:'es', EC:'es', BO:'es', PY:'es', UY:'es',
        FR:'fr', BE:'fr', MC:'fr', SN:'fr', CI:'fr', CM:'fr', MG:'fr',
        SA:'ar', EG:'ar', AE:'ar', IQ:'ar', SY:'ar', JO:'ar', KW:'ar', QA:'ar', BH:'ar', OM:'ar', YE:'ar', LY:'ar', TN:'ar', MA:'ar', DZ:'ar', SD:'ar', LB:'ar',
        BR:'pt', PT:'pt', AO:'pt', MZ:'pt', CV:'pt',
        RU:'ru', BY:'ru', KZ:'ru',
        CN:'zh', TW:'zh', HK:'zh', MO:'zh',
        IN:'hi',
        PK:'ur',
        IL:'he',
        AM:'hy'
    };

    function getCurrentLang() {
        var m = window.location.pathname.match(/^\/([a-z]{2})\//);
        if (m && SUPPORTED.indexOf(m[1]) !== -1) return m[1];
        var hl = document.documentElement.lang;
        if (hl && SUPPORTED.indexOf(hl) !== -1) return hl;
        return 'en';
    }

    function wasDismissed() {
        try {
            var v = localStorage.getItem('aBest_geo_dismissed');
            if (!v) return false;
            return (Date.now() - parseInt(v, 10)) < 30 * 24 * 60 * 60 * 1000;
        } catch(e) { return false; }
    }

    function dismiss() {
        try { localStorage.setItem('aBest_geo_dismissed', String(Date.now())); } catch(e) {}
    }

    function buildLangUrl(lang) {
        var cur = getCurrentLang();
        return window.location.pathname.replace(new RegExp('^/' + cur + '/'), '/' + lang + '/');
    }

    function showBanner(sugLang, curLang) {
        var path = window.location.pathname;
        if (/\/(profil|profile|login|register)/.test(path)) return;
        if (document.getElementById('geo-lang-banner')) return;

        var name = LANG_NAMES[sugLang] || sugLang;
        var url  = buildLangUrl(sugLang);
        var isRTL = ['ar','he','ur'].includes ? ['ar','he','ur'].includes(sugLang) : (sugLang==='ar'||sugLang==='he'||sugLang==='ur');

        var msgs = {
            de:'Diese Seite ist auch auf Deutsch verfügbar.',
            en:'This page is also available in English.',
            tr:'Bu sayfa Türkçe olarak da mevcuttur.',
            es:'Esta página también está disponible en Español.',
            fr:'Cette page est aussi disponible en Français.',
            ar:'هذه الصفحة متاحة أيضاً باللغة العربية.',
            pt:'Esta página também está disponível em Português.',
            ru:'Эта страница также доступна на Русском.',
            zh:'此页面也提供中文版本。',
            hi:'यह पेज हिन्दी में भी उपलब्ध है।',
            ur:'یہ صفحہ اردو میں بھی دستیاب ہے۔',
            ku:'Ev rûpel bi Kurdî jî heye.',
            he:'דף זה זמין גם בעברית.',
            hy:'Այս էջը հասանելի է նաև Հայերենով:'
        };
        var switchLabels = {
            en:'View in English', de:'Auf Deutsch anzeigen', tr:'Türkçe görüntüle',
            es:'Ver en Español', fr:'Voir en Français', ar:'عرض بالعربية',
            pt:'Ver em Português', ru:'Смотреть на Русском', zh:'查看中文版',
            hi:'हिन्दी में देखें', ur:'اردو میں دیکھیں', ku:'Bi Kurdî bibîne',
            he:'צפה בעברית', hy:'Դիտել հայերեն'
        };
        var stayLabels = {
            en:'Stay here', de:'Hier bleiben', tr:'Burada kal',
            es:'Quedarme aquí', fr:'Rester ici', ar:'البقاء هنا',
            pt:'Ficar aqui', ru:'Остаться', zh:'留在此处',
            hi:'यहाँ रहें', ur:'یہاں رہیں', ku:'Li vir bimîne',
            he:'להישאר כאן', hy:'Մնալ այստեղ'
        };

        var style = document.createElement('style');
        style.textContent = '@keyframes geoUp{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
        document.head.appendChild(style);

        var b = document.createElement('div');
        b.id = 'geo-lang-banner';
        b.setAttribute('role', 'alert');
        b.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
            'background:rgba(16,18,28,0.97);color:#f0f4ff;border-radius:14px;' +
            'padding:14px 18px;max-width:440px;width:calc(100% - 32px);' +
            'box-shadow:0 8px 36px rgba(0,0,0,0.45);z-index:88888;' +
            'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13.5px;line-height:1.5;' +
            'display:flex;flex-direction:column;gap:10px;' +
            'border:1px solid rgba(255,255,255,0.1);' +
            'animation:geoUp 0.32s ease;direction:' + (isRTL ? 'rtl' : 'ltr') + ';';

        b.innerHTML =
            '<div style="display:flex;align-items:flex-start;gap:10px">' +
              '<span style="font-size:18px">🌐</span>' +
              '<span style="flex:1">' + (msgs[sugLang] || msgs.en) + '</span>' +
              '<button id="geo-close" style="background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:17px;margin-left:auto;padding:0;line-height:1;flex-shrink:0" aria-label="Schließen">×</button>' +
            '</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
              '<a id="geo-switch" href="' + url + '" style="background:#007aff;color:#fff;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap">' + (switchLabels[sugLang] || name) + '</a>' +
              '<button id="geo-stay" style="background:rgba(255,255,255,0.1);color:#c8d4f0;border:none;border-radius:9px;padding:8px 14px;font-size:13px;cursor:pointer;white-space:nowrap">' + (stayLabels[curLang] || 'Stay') + '</button>' +
            '</div>';

        document.body.appendChild(b);

        function close() { if (b.parentNode) b.remove(); dismiss(); }
        document.getElementById('geo-close').onclick = close;
        document.getElementById('geo-stay').onclick = close;
        document.getElementById('geo-switch').onclick = function() {
            if (typeof setLang === 'function') setLang(sugLang);
            dismiss();
        };
        setTimeout(function() { if (b.parentNode) b.remove(); }, 18000);
    }

    function init() {
        if (wasDismissed()) return;
        var curLang = getCurrentLang();

        // Daten aus _worker.js-Injektion lesen (window._geo), Fallback auf navigator
        var geo = window._geo || {};
        var country = geo.c || '';
        var bl = geo.l || ((navigator.language || 'en').split('-')[0].toLowerCase());
        var browserLang = SUPPORTED.indexOf(bl) !== -1 ? bl : 'en';

        // Land-basierte Sprachermittlung hat Vorrang vor Browser-Sprache
        var countryLang = country && COUNTRY_LANG[country] ? COUNTRY_LANG[country] : browserLang;

        if (countryLang !== curLang) {
            showBanner(countryLang, curLang);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Kleine Verzögerung damit die Seite zuerst lädt
        setTimeout(init, 800);
    }

})(); // END GEO ENGINE
