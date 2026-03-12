// --- IN-MEMORY CACHE FOR FREE TIER LIMITS ---
// Workers are stateless, but this persists per edge node for the lifetime of the basic isolate.
// Helps significantly reduce KV .list() operations (Free limit: 1000/day).
const globalCache = {
    inquiries: { data: null, timestamp: 0 },
    users: { data: null, timestamp: 0 },
    docs: { data: null, timestamp: 0 },
    CACHE_TTL: 60000 // 60 seconds
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        const host = url.hostname;

        // --- 0. LOOP PROTECTION ---
        if (request.headers.get('X-Internal-Fetch')) {
            return env.ASSETS.fetch(request);
        }

        // --- 1. LANGUAGE REDIRECTION FOR ROOT (/) ---
        if (pathname === '/') {
            const acceptLanguage = request.headers.get('Accept-Language') || 'en';
            const langCode = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
            const supportedLangs = ["en", "de", "tr", "es", "zh", "hi", "ar", "fr", "ru", "pt", "ur", "ku", "he", "hy"];
            const targetLang = supportedLangs.includes(langCode) ? langCode : 'en';
            return Response.redirect(`https://${host}/${targetLang}/`, 302);
        }

        // --- 1.2 BROWSER ROUTES (/login, /register, /profile) ---
        // Match both /login and /en/login, /de/login etc.
        const cleanPath = pathname.replace(/^\/(en|de|tr|es|zh|hi|ar|fr|ru|pt|ur|ku|he|hy)\//, '/');

        if (cleanPath === '/login' || cleanPath === '/register' ||
            cleanPath === '/profile' || cleanPath.startsWith('/profile/') || cleanPath.startsWith('/profil/')) {
            const acceptLanguage = request.headers.get('Accept-Language') || 'en';
            const langCode = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
            const supportedLangs = ["en", "de", "tr", "es", "zh", "hi", "ar", "fr", "ru", "pt", "ur", "ku", "he", "hy"];

            // Priority: URL prefix > Cookie > Accept-Language
            let targetLang = pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[1];
            if (!targetLang || !supportedLangs.includes(targetLang)) {
                const cookies = request.headers.get('Cookie') || '';
                targetLang = cookies.match(/aBest_lang=([a-z]{2})/)?.[1];
            }
            if (!targetLang || !supportedLangs.includes(targetLang)) {
                targetLang = supportedLangs.includes(langCode) ? langCode : 'en';
            }

            let file = 'login';
            if (cleanPath === '/register') file = 'register';
            if (cleanPath === '/profile' || cleanPath.startsWith('/profile/') || cleanPath.startsWith('/profil/')) file = 'profil';

            // We rewrite internal URL to serve the localized file
            const assetUrl = new URL(request.url);
            assetUrl.pathname = `/${targetLang}/${file}`;

            // Internal fetch with loop protection
            const internalReq = new Request(assetUrl.toString(), request);
            internalReq.headers.set('X-Internal-Fetch', 'true');
            let res = await env.ASSETS.fetch(internalReq);

            // Fallback to English if localized file not found
            if (res.status === 404 && targetLang !== 'en') {
                assetUrl.pathname = `/en/${file}`;
                const innerReq = new Request(assetUrl.toString(), request);
                innerReq.headers.set('X-Internal-Fetch', 'true');
                res = await env.ASSETS.fetch(innerReq);
            }

            // If still not ok or a redirect (Clean URLs), just return as is
            if (!res.ok) return res;

            // SEO: Inject localized meta tags
            let html = await res.text();
            if (!html) return res;

            const translations = {
                de: { login: 'Login | aBest.co', register: 'Registrierung | aBest.co', profile: 'Mein Profil | aBest.co', desc: 'Premium Land- und Immobilienentwicklung.' },
                en: { login: 'Login | aBest.co', register: 'Register | aBest.co', profile: 'My Profile | aBest.co', desc: 'Global Premium Land & Real Estate Development.' },
                tr: { login: 'Giriş | aBest.co', register: 'Kayıt Ol | aBest.co', profile: 'Profilim | aBest.co', desc: 'Global Premium Arazi ve Gayrimenkul Geliştirme.' },
                es: { login: 'Acceso | aBest.co', register: 'Registro | aBest.co', profile: 'Mi Perfil | aBest.co', desc: 'Desarrollo inmobiliario premium global.' },
                fr: { login: 'Connexion | aBest.co', register: 'Inscription | aBest.co', profile: 'Mon Profil | aBest.co', desc: 'Développement immobilier premium mondial.' }
            };
            const t = translations[targetLang] || translations['en'];
            const pageKey = cleanPath === '/login' ? 'login' : (cleanPath === '/register' ? 'register' : 'profile');

            html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t[pageKey]}</title>`);
            html = html.replace(/<meta name="description" content=".*?" \/>/g, `<meta name="description" content="${t.desc}" />`);
            html = html.replace(/<meta content=".*?" name="description" \/>/g, `<meta name="description" content="${t.desc}" />`);

            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-Debug-Path': assetUrl.pathname,
                    'X-Debug-Source': 'Worker-SEO'
                }
            });
        }

        // --- 1.3 PARTNERSCHAFTEN SUB-PATHS ---
        // /de/partnerschaften/idee  →  serve /de/partnerschaften.html
        if (cleanPath.startsWith('/partnerschaften/') || cleanPath.startsWith('/partnerships/')) {
            const supportedLangs2 = ["en","de","tr","es","zh","hi","ar","fr","ru","pt","ur","ku","he","hy"];
            let pLang = pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[1];
            if (!pLang || !supportedLangs2.includes(pLang)) {
                const cookies = request.headers.get('Cookie') || '';
                pLang = cookies.match(/aBest_lang=([a-z]{2})/)?.[1];
            }
            if (!pLang || !supportedLangs2.includes(pLang)) pLang = 'de';
            const pUrl = new URL(request.url);
            pUrl.pathname = `/${pLang}/partnerschaften`;
            const pReq = new Request(pUrl.toString(), request);
            pReq.headers.set('X-Internal-Fetch', 'true');
            const pRes = await env.ASSETS.fetch(pReq);
            if (pRes.ok) return new Response(pRes.body, { headers: pRes.headers });
        }

        // --- 2. API ROUTES ---
        if (pathname.startsWith('/api/payout')) {
            return handlePayoutApi(request, env);
        }
        if (pathname.startsWith('/api/auth/')) {
            return handleAuthApi(request, env);
        }

        if (pathname.startsWith('/api/contact')) {
            return handleContactApi(request, env);
        }

        if (pathname.startsWith('/api/behavior')) {
            return handleBehaviorApi(request, env);
        }

        if (pathname.startsWith('/api/role')) {
            return handleRoleApi(request, env);
        }

        if (pathname.startsWith('/api/listings')) {
            return handleListingsApi(request, env);
        }

        if (pathname.startsWith('/api/team')) {
            return handleTeamApi(request, env);
        }

        if (pathname.startsWith('/api/inquiries') || pathname.startsWith('/api/users') || pathname.startsWith('/api/messages')) {
            // Check auth for sensitive methods
            if (['GET', 'PUT', 'DELETE', 'POST'].includes(request.method)) {
                const userEmail = await checkAuth(request, env);
                if (!userEmail) return unauthorizedResponse();
                // Optionally pass userEmail to handleInquiriesApi if needed
            }
            if (pathname.startsWith('/api/users')) {
                return handleUsersApi(request, env);
            }
            if (pathname.startsWith('/api/messages')) {
                return handleMessagesApi(request, env);
            }
            if (pathname.startsWith('/api/docs')) {
                return handleDocsApi(request, env);
            }
            return handleInquiriesApi(request, env);
        }

        // --- 2. ADMIN AREA ---
        const isAdminPath = pathname === '/admin' || pathname === '/admin/' ||
            (pathname.startsWith('/admin/') && !pathname.match(/\.(js|css|html|png|jpg|svg|ico|json|woff|woff2|ttf)$/));
        if (isAdminPath) {
            const userEmail = await checkAuth(request, env);
            if (!userEmail) return Response.redirect(`https://${host}/login`, 302);

            // Check if user is admin
            let isAdmin = userEmail === 'admin';
            if (!isAdmin && env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
                if (profileStr) {
                    const p = JSON.parse(profileStr);
                    isAdmin = (p.role === 'Admin' || p.role === 'Superadmin');
                }
            }
            if (!isAdmin) return Response.redirect(`https://${host}/profile`, 302);

            // For sub-paths (/admin/users, /admin/idee etc.) serve admin/index.html
            if (pathname !== '/admin' && pathname !== '/admin/') {
                const adminUrl = new URL(request.url);
                adminUrl.pathname = '/admin/';
                const adminReq = new Request(adminUrl.toString(), request);
                adminReq.headers.set('X-Internal-Fetch', 'true');
                const adminRes = await env.ASSETS.fetch(adminReq);
                if (adminRes.ok) return new Response(adminRes.body, { headers: adminRes.headers });
            }
            // For /admin and /admin/ ASSETS.fetch will handle it below
        }

        // --- 1.4 EARN-MONEY MAIN PAGE + SUB-PATHS ---
        // /xx/earn-money  →  serve /xx/earn-money.html directly (bypasses any _redirects CDN cache)
        const _emPathMatch = pathname.match(/^\/(en|tr|es|fr|ar|ru|zh|hi|pt|ur|ku|he|hy|de)\/earn-money\/?$/);
        if (_emPathMatch) {
            const _emLang = _emPathMatch[1];
            const _emFileUrl = `https://${host}/${_emLang}/earn-money.html`;
            const _emRes = await env.ASSETS.fetch(new Request(_emFileUrl, { method: 'GET', headers: { 'X-Internal-Fetch': 'true' } }));
            if (_emRes.ok) {
                const _emHeaders = new Headers(_emRes.headers);
                _emHeaders.set('Content-Type', 'text/html; charset=utf-8');
                return new Response(_emRes.body, { status: 200, headers: _emHeaders });
            }
        }
        // /de/earn-money/founder  →  serve /de/earn-money/founder.html
        // Falls back to /de/ version if localized sub-page doesn't exist
        if (cleanPath.startsWith('/earn-money/')) {
            const emLang = pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[1] || 'de';
            const emSlug = cleanPath.replace('/earn-money/', '').split('/')[0];
            const validSlugs = ['founder','investor','capital-partner','seller','business','explorer'];
            if (validSlugs.includes(emSlug)) {
                const emUrl = new URL(request.url);
                emUrl.pathname = `/${emLang}/earn-money/${emSlug}.html`;
                const emReq = new Request(emUrl.toString(), request);
                emReq.headers.set('X-Internal-Fetch', 'true');
                const emRes = await env.ASSETS.fetch(emReq);
                if (emRes.ok) return new Response(emRes.body, { headers: emRes.headers });
                // Fallback: serve German version for languages without own sub-page
                if (emLang !== 'de') {
                    const emFbUrl = new URL(request.url);
                    emFbUrl.pathname = `/de/earn-money/${emSlug}.html`;
                    const emFbReq = new Request(emFbUrl.toString(), request);
                    emFbReq.headers.set('X-Internal-Fetch', 'true');
                    const emFbRes = await env.ASSETS.fetch(emFbReq);
                    if (emFbRes.ok) return new Response(emFbRes.body, { headers: emFbRes.headers });
                }
            }
        }

        // --- 1.5 ROSAMOND LAND PROJECT ---
        // /xx/usa/california/kern-county/rosamond  →  serve /de/usa/california/kern-county/rosamond/index.html
        if (cleanPath === '/usa/california/kern-county/rosamond' ||
            cleanPath === '/usa/california/kern-county/rosamond/') {
            const rmdUrl = new URL(request.url);
            rmdUrl.pathname = '/de/usa/california/kern-county/rosamond/index.html';
            const rmdReq = new Request(rmdUrl.toString(), request);
            rmdReq.headers.set('X-Internal-Fetch', 'true');
            const rmdRes = await env.ASSETS.fetch(rmdReq);
            if (rmdRes.ok) return new Response(rmdRes.body, { headers: rmdRes.headers });
        }

        // --- 1.6 HALF MOON BAY LAND PROJECT ---
        // /xx/usa/california/san-mateo-county/half-moon-bay → serve de page for all languages
        if (cleanPath === '/usa/california/san-mateo-county/half-moon-bay' ||
            cleanPath === '/usa/california/san-mateo-county/half-moon-bay/') {
            const hmbUrl = new URL(request.url);
            hmbUrl.pathname = '/de/usa/california/san-mateo-county/half-moon-bay/index.html';
            const hmbReq = new Request(hmbUrl.toString(), request);
            hmbReq.headers.set('X-Internal-Fetch', 'true');
            const hmbRes = await env.ASSETS.fetch(hmbReq);
            if (hmbRes.ok) return new Response(hmbRes.body, { headers: hmbRes.headers });
        }

        // --- 3. 301 REDIRECTS ---
        // /{lang}/ideen → /{lang}/earn-money (URL rename, all languages)
        {
            const _idLang = pathname.match(/^\/([a-z]{2})\//)?.[1];
            const _idClean = _idLang ? pathname.slice(3) : pathname;
            if (_idClean === '/ideen' || _idClean === '/ideen.html') {
                const _redirLang = _idLang || 'de';
                return Response.redirect(`https://${host}/${_redirLang}/earn-money`, 301);
            }
        }
        if (url.hostname === 'abest.com' || url.hostname === 'www.abest.com') {
            const newUrl = new URL(request.url);
            newUrl.hostname = 'abest.co';
            return Response.redirect(newUrl.toString(), 301);
        }

        // --- 4. STATIC ASSETS & PAGES ---
        // For HTML pages: inject window._geo (country + browser language) for client-side geo detection
        if (request.method === 'GET' &&
            !pathname.match(/\.(js|css|png|jpg|jpeg|webp|gif|svg|ico|json|woff|woff2|ttf|eot|pdf|xml|txt|map|gz)$/)) {
            const geoRes = await env.ASSETS.fetch(request);
            if (geoRes && geoRes.ok) {
                const ct = geoRes.headers.get('Content-Type') || '';
                if (ct.includes('text/html')) {
                    const cfCountry = (request.cf && request.cf.country) ? String(request.cf.country).replace(/[^A-Z]/g, '').slice(0, 2) : '';
                    const acceptLang = request.headers.get('Accept-Language') || 'en';
                    const bl = acceptLang.split(',')[0].split('-')[0].toLowerCase();
                    const supportedL = ["en","de","tr","es","zh","hi","ar","fr","ru","pt","ur","ku","he","hy"];
                    const detectedL = supportedL.includes(bl) ? bl : 'en';
                    const geoTag = `<script>window._geo={c:"${cfCountry}",l:"${detectedL}"};</script>`;
                    let html = await geoRes.text();
                    html = html.replace('</head>', geoTag + '\n</head>');
                    const newHeaders = new Headers(geoRes.headers);
                    newHeaders.set('Content-Type', 'text/html; charset=utf-8');
                    return new Response(html, { status: geoRes.status, headers: newHeaders });
                }
            }
            return geoRes || env.ASSETS.fetch(request);
        }
        return env.ASSETS.fetch(request);
    },
};

// Helper for Authentication
async function checkAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.split(' ')[1];

    // Check old hardcoded auth fallback (optional, remove later)
    const expectedUser = env.ADMIN_USER;
    const expectedPass = env.ADMIN_PASS;
    const expectedBasic = 'Basic ' + btoa(`${expectedUser}:${expectedPass}`);
    // If using the old fallback, we just return 'admin' as the identifier
    if (authHeader === expectedBasic) return 'admin';

    if (env.ABEST_AUTH && token) {
        const sessionEmail = await env.ABEST_AUTH.get(`session:${token}`);
        if (sessionEmail) return sessionEmail; // Return the email associated with the session
    }

    return false;
}

function unauthorizedResponse() {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'WWW-Authenticate': 'Bearer realm="aBest.co"',
            'Content-Type': 'application/json'
        }
    });
}

// --- EMAIL NOTIFICATION HELPER (Brevo REST API) ---
async function sendBrevoNotification(env, subject, htmlContent) {
    if (!env.BREVO_API_KEY) return; // Skip if not configured
    try {
        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': env.BREVO_API_KEY
            },
            body: JSON.stringify({
                sender: { name: 'aBest.co', email: 'i@abest.co' },
                to: [{ email: 'i@abest.co', name: 'Alan Best' }],
                subject: subject,
                htmlContent: htmlContent
            })
        });
    } catch (e) {
        // Fire-and-forget – never block the user response
    }
}

// --- API HANDLERS ---
async function handleInquiriesApi(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (!env.ABEST_INQUIRIES) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
            status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    try {
        // GET /api/inquiries : Fetch all inquiries
        if (method === 'GET' && url.pathname === '/api/inquiries') {
            const now = Date.now();
            let inquiries = [];

            // Check In-Memory Cache first (save KV list operations)
            if (globalCache.inquiries.data && (now - globalCache.inquiries.timestamp < globalCache.CACHE_TTL)) {
                inquiries = globalCache.inquiries.data;
            } else {
                const list = await env.ABEST_INQUIRIES.list();
                for (const key of list.keys) {
                    const value = await env.ABEST_INQUIRIES.get(key.name);
                    if (value) inquiries.push(JSON.parse(value));
                }
                // Sort newest first
                inquiries.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Update Cache
                globalCache.inquiries.data = inquiries;
                globalCache.inquiries.timestamp = now;
            }

            return new Response(JSON.stringify(inquiries), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // POST /api/inquiries : Create new inquiry (Accepts FormData and JSON)
        if (method === 'POST' && url.pathname === '/api/inquiries') {
            const contentType = request.headers.get('content-type') || '';
            let data = {};

            if (contentType.includes('multipart/form-data')) {
                const formData = await request.formData();
                for (const [key, value] of formData.entries()) {
                    if (key !== 'attachment') { // Ignore file uploads for Free Tier
                        data[key] = value;
                    }
                }
            } else {
                data = await request.json();
            }

            const id = crypto.randomUUID();
            data.id = id;
            data.date = data.date || new Date().toISOString();
            data.status = data.status || 'Neu';

            await env.ABEST_INQUIRIES.put(id, JSON.stringify(data));

            // Email notification (fire-and-forget)
            const inqType = data.type || 'Anfrage';
            const inqName = data.name || data.Name || '(unbekannt)';
            const inqEmail = data.email || data.Email || '';
            const rows = Object.entries(data)
                .filter(([k]) => !['id','date','status'].includes(k))
                .map(([k,v]) => `<tr><td style="padding:4px 8px;font-weight:bold;color:#555">${k}</td><td style="padding:4px 8px">${v}</td></tr>`)
                .join('');
            sendBrevoNotification(env,
                `🤝 Neue Partnerschaftsanfrage: ${inqType} von ${inqName}`,
                `<h2>Neue Anfrage: ${inqType}</h2>
                 <table style="border-collapse:collapse">${rows}</table>
                 <p style="color:#888;font-size:12px">Eingegangen: ${data.date}</p>`
            );

            // Invalidate cache on new inquiry
            globalCache.inquiries.data = null;

            return new Response(JSON.stringify({ success: true, id }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // PUT /api/inquiries/:id : Update existing inquiry
        if (method === 'PUT' && url.pathname.startsWith('/api/inquiries/')) {
            const id = url.pathname.split('/').pop();
            const updates = await request.json();

            const existingStr = await env.ABEST_INQUIRIES.get(id);
            if (!existingStr) {
                return new Response(JSON.stringify({ error: 'Not found' }), {
                    status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            const existing = JSON.parse(existingStr);
            const merged = { ...existing, ...updates };

            // Invalidate cache on update
            globalCache.inquiries.data = null;

            return new Response(JSON.stringify({ success: true, data: merged }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// --- USERS API HANDLER ---
async function handleUsersApi(request, env) {
    const method = request.method;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        if (method === 'GET') {
            const now = Date.now();
            let users = [];

            // Check In-Memory Cache
            if (globalCache.users.data && (now - globalCache.users.timestamp < globalCache.CACHE_TTL)) {
                users = globalCache.users.data;
            } else {
                const list = await env.ABEST_AUTH.list({ prefix: 'profile:' });
                for (const key of list.keys) {
                    const profileStr = await env.ABEST_AUTH.get(key.name);
                    if (profileStr) {
                        const profile = JSON.parse(profileStr);
                        users.push({
                            email: profile.email,
                            name: profile.name || '-',
                            company: profile.company || '-',
                            role: profile.role || 'User',
                            status: 'Aktiv',
                            lastLogin: profile.lastLogin || '-'
                        });
                    }
                }
                
                // Update Cache
                globalCache.users.data = users;
                globalCache.users.timestamp = now;
            }
            
            return new Response(JSON.stringify(users), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
        return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// --- MESSAGES API HANDLER ---
async function handleMessagesApi(request, env) {
    const method = request.method;
    const url = new URL(request.url);
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        const currentUser = await checkAuth(request, env);
        if (!currentUser) return unauthorizedResponse();

        // Admin check (simple logic based on role in profile or 'admin' fallback)
        let isAdmin = currentUser === 'admin';
        if (!isAdmin && env.ABEST_AUTH) {
            const profileStr = await env.ABEST_AUTH.get(`profile:${currentUser}`);
            if (profileStr) {
                const p = JSON.parse(profileStr);
                isAdmin = (p.role === 'Admin' || p.role === 'Superadmin');
            }
        }

        if (method === 'GET') {
            // Admin can request specifically /api/messages/:email
            const targetEmail = url.pathname.split('/api/messages/')[1];

            if (targetEmail && isAdmin) {
                const messagesStr = await env.ABEST_AUTH.get(`messages:${targetEmail}`);
                return new Response(messagesStr || '[]', { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            } else {
                // Return current user's messages
                const messagesStr = await env.ABEST_AUTH.get(`messages:${currentUser}`);
                return new Response(messagesStr || '[]', { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }
        }

        if (method === 'POST') {
            const body = await request.json();
            const text = body.text;
            let targetUser = currentUser;

            if (isAdmin && body.targetUser) {
                targetUser = body.targetUser;
            }

            if (!text) return new Response(JSON.stringify({ error: 'Message text required' }), { status: 400, headers: corsHeaders });

            const newMessage = {
                id: crypto.randomUUID(),
                sender: isAdmin && currentUser !== targetUser ? 'admin' : 'user',
                text: text,
                subject: body.subject || '',
                timestamp: new Date().toISOString(),
                unread: true
            };

            const existingStr = await env.ABEST_AUTH.get(`messages:${targetUser}`);
            let messages = existingStr ? JSON.parse(existingStr) : [];
            messages.push(newMessage);

            await env.ABEST_AUTH.put(`messages:${targetUser}`, JSON.stringify(messages));

            return new Response(JSON.stringify({ success: true, message: newMessage }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// --- DOCUMENTS API HANDLER ---
async function handleDocsApi(request, env) {
    const method = request.method;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        const userEmail = await checkAuth(request, env);
        if (!userEmail) return unauthorizedResponse();

        if (method === 'GET') {
            const now = Date.now();
            let docs = [];

            if (globalCache.docs.data && (now - globalCache.docs.timestamp < globalCache.CACHE_TTL)) {
                docs = globalCache.docs.data;
            } else {
                const list = await env.ABEST_AUTH.list({ prefix: 'doc:' });
                for (const key of list.keys) {
                    const docStr = await env.ABEST_AUTH.get(key.name);
                    if (docStr) docs.push(JSON.parse(docStr));
                }

                // Temporary Fallback if empty
                if (docs.length === 0) {
                    docs.push({ name: "Unternehmensprofil.pdf", type: "PDF", size: "1.2 MB", date: new Date().toISOString(), owner: "System" });
                }

                globalCache.docs.data = docs;
                globalCache.docs.timestamp = now;
            }

            return new Response(JSON.stringify(docs), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
        return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// --- PASSWORD HASHING (PBKDF2 + per-user random salt) ---
// Legacy global salt kept ONLY for migrating old accounts on first login
const LEGACY_SALT = 'abest_global_salt_2026';

async function hashPassword(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true, ["encrypt", "decrypt"]
    );
    const exported = await crypto.subtle.exportKey("raw", key);
    return Array.from(new Uint8Array(exported)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt(length = 32) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- LOGIN RATE LIMITER (brute force protection) ---
async function checkLoginRateLimit(env, email) {
    if (!env.ABEST_AUTH) return { allowed: true };
    const key = `ratelimit:${email}`;
    const raw = await env.ABEST_AUTH.get(key);
    const now = Date.now();
    const window = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 10;

    let data = raw ? JSON.parse(raw) : { attempts: 0, windowStart: now };
    if (now - data.windowStart > window) {
        data = { attempts: 0, windowStart: now }; // reset window
    }
    if (data.attempts >= maxAttempts) {
        const retryAfter = Math.ceil((data.windowStart + window - now) / 1000);
        return { allowed: false, retryAfter };
    }
    return { allowed: true, data, key, window };
}

async function recordLoginFailure(env, email) {
    if (!env.ABEST_AUTH) return;
    const key = `ratelimit:${email}`;
    const raw = await env.ABEST_AUTH.get(key);
    const now = Date.now();
    const window = 15 * 60 * 1000;
    let data = raw ? JSON.parse(raw) : { attempts: 0, windowStart: now };
    if (now - data.windowStart > window) data = { attempts: 0, windowStart: now };
    data.attempts++;
    await env.ABEST_AUTH.put(key, JSON.stringify(data), { expirationTtl: 900 }); // auto-expire 15min
}

async function clearLoginRateLimit(env, email) {
    if (!env.ABEST_AUTH) return;
    await env.ABEST_AUTH.delete(`ratelimit:${email}`);
}

// --- AUTHENTICATION HANDLERS ---
async function handleAuthApi(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (method === 'POST' && url.pathname === '/api/auth/google') {
            const { credential } = await request.json();

            if (!credential) {
                return new Response(JSON.stringify({ error: 'No credential provided' }), { status: 400, headers: corsHeaders });
            }

            // Verify JWT with Google's tokeninfo endpoint
            const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
            if (!verifyResponse.ok) {
                return new Response(JSON.stringify({ error: 'Invalid Google token' }), { status: 401, headers: corsHeaders });
            }

            const tokenInfo = await verifyResponse.json();

            // Optional: verify the audience (client ID) matches yours to prevent cross-client token use
            // const CLIENT_ID = '660480949703-vmvtk8kqp6ueb1o8k0tui860mjmdm0n6.apps.googleusercontent.com';
            // if (tokenInfo.aud !== CLIENT_ID) {
            //     return new Response(JSON.stringify({ error: 'Token audience mismatch' }), { status: 401, headers: corsHeaders });
            // }

            const userEmail = tokenInfo.email;
            if (!userEmail) {
                return new Response(JSON.stringify({ error: 'Email not found in token' }), { status: 400, headers: corsHeaders });
            }

            const sessionId = crypto.randomUUID();
            // Assuming KV bound as ABEST_AUTH
            if (env.ABEST_AUTH) {
                await env.ABEST_AUTH.put(`session:${sessionId}`, userEmail, { expirationTtl: 86400 }); // 24h

                // Also store user profile if needed
                await env.ABEST_AUTH.put(`user_profile:${userEmail}`, JSON.stringify({
                    name: tokenInfo.name,
                    picture: tokenInfo.picture,
                    email: tokenInfo.email
                }));
            }

            return new Response(JSON.stringify({ success: true, token: sessionId, user: { email: userEmail, name: tokenInfo.name } }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (method === 'POST' && url.pathname === '/api/auth/login') {
            const { email, password } = await request.json();
            if (!email || !password) {
                return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers: corsHeaders });
            }

            // Brute force protection
            const rateLimit = await checkLoginRateLimit(env, email);
            if (!rateLimit.allowed) {
                return new Response(JSON.stringify({ error: `Too many login attempts. Try again in ${rateLimit.retryAfter}s.` }), {
                    status: 429, headers: { ...corsHeaders, 'Retry-After': String(rateLimit.retryAfter) }
                });
            }

            if (env.ABEST_AUTH) {
                const storedPass = await env.ABEST_AUTH.get(`user:${email}`);
                if (storedPass) {
                    // Try per-user salt first, fall back to legacy global salt (migration)
                    const userSalt = await env.ABEST_AUTH.get(`salt:${email}`);
                    const saltToUse = userSalt || LEGACY_SALT;
                    const hashedInput = await hashPassword(password, saltToUse);

                    if (storedPass === hashedInput) {
                        // Migrate legacy accounts to per-user salt on successful login
                        if (!userSalt) {
                            const newSalt = generateSalt();
                            const newHash = await hashPassword(password, newSalt);
                            await env.ABEST_AUTH.put(`salt:${email}`, newSalt);
                            await env.ABEST_AUTH.put(`user:${email}`, newHash);
                        }

                        await clearLoginRateLimit(env, email);
                        const sessionId = crypto.randomUUID();
                        await env.ABEST_AUTH.put(`session:${sessionId}`, email, { expirationTtl: 86400 });

                        const existingProfile = await env.ABEST_AUTH.get(`profile:${email}`);
                        if (!existingProfile) {
                            await env.ABEST_AUTH.put(`profile:${email}`, JSON.stringify({ email, role: 'User' }));
                        }

                        return new Response(JSON.stringify({ success: true, token: sessionId, email }), {
                            headers: { 'Content-Type': 'application/json', ...corsHeaders }
                        });
                    }
                }
            }

            await recordLoginFailure(env, email);
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
        }

        if (method === 'POST' && url.pathname === '/api/auth/register') {
            const { email, password } = await request.json();
            if (!email || !password || password.length < 8) {
                return new Response(JSON.stringify({ error: 'Valid email and password (min 8 chars) required' }), { status: 400, headers: corsHeaders });
            }

            if (env.ABEST_AUTH) {
                const exists = await env.ABEST_AUTH.get(`user:${email}`);
                if (exists) {
                    return new Response(JSON.stringify({ error: 'User already exists' }), { status: 400, headers: corsHeaders });
                }

                const salt = generateSalt();
                const hashedPassword = await hashPassword(password, salt);
                await env.ABEST_AUTH.put(`salt:${email}`, salt);
                await env.ABEST_AUTH.put(`user:${email}`, hashedPassword);
                
                // Preserve existing admin/superadmin role if pre-assigned (bootstrapping)
                const existingRegProfile = await env.ABEST_AUTH.get(`profile:${email}`);
                const existingRegData = existingRegProfile ? JSON.parse(existingRegProfile) : {};
                const adminRoles = ['Admin', 'Superadmin'];
                const assignedRole = adminRoles.includes(existingRegData.role) ? existingRegData.role : 'User';
                
                await env.ABEST_AUTH.put(`profile:${email}`, JSON.stringify({ email, name: existingRegData.name || '', phone: existingRegData.phone || '', company: existingRegData.company || '', role: assignedRole }));

                // Invalidate users cache
                globalCache.users.data = null;

                const sessionId = crypto.randomUUID();
                await env.ABEST_AUTH.put(`session:${sessionId}`, email, { expirationTtl: 86400 });

                return new Response(JSON.stringify({ success: true, token: sessionId, email }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
            return new Response(JSON.stringify({ error: 'Storage not configured' }), { status: 500, headers: corsHeaders });
        }

        if (method === 'GET' && url.pathname === '/api/auth/me') {
            const userEmail = await checkAuth(request, env);
            if (!userEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

            if (env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
                const profile = profileStr ? JSON.parse(profileStr) : { email: userEmail, role: 'User' };
                return new Response(JSON.stringify(profile), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
            return new Response(JSON.stringify({ error: 'Storage missing' }), { status: 500, headers: corsHeaders });
        }

        if (method === 'PUT' && url.pathname === '/api/auth/me') {
            const userEmail = await checkAuth(request, env);
            if (!userEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

            const updates = await request.json();

            if (env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
                const profile = profileStr ? JSON.parse(profileStr) : { email: userEmail, role: 'User' };

                // Allow specific fields to be updated
                if (updates.name !== undefined) profile.name = updates.name;
                if (updates.phone !== undefined) profile.phone = updates.phone;
                if (updates.company !== undefined) profile.company = updates.company;
                // Note: avatar is now handled via dedicated /api/auth/avatar endpoint

                await env.ABEST_AUTH.put(`profile:${userEmail}`, JSON.stringify(profile));
                return new Response(JSON.stringify({ success: true, profile }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
            return new Response(JSON.stringify({ error: 'Storage missing' }), { status: 500, headers: corsHeaders });
        }

        // ── Change Password ──────────────────────────────────────────────────
        if (method === 'PUT' && url.pathname === '/api/auth/password') {
            const userEmail = await checkAuth(request, env);
            if (!userEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            if (!env.ABEST_AUTH) return new Response(JSON.stringify({ error: 'Storage missing' }), { status: 500, headers: corsHeaders });
            const { currentPassword, newPassword } = await request.json();
            if (!currentPassword || !newPassword) {
                return new Response(JSON.stringify({ error: 'Fehlende Felder' }), { status: 400, headers: corsHeaders });
            }
            if (newPassword.length < 8) {
                return new Response(JSON.stringify({ error: 'Neues Passwort muss mindestens 8 Zeichen haben' }), { status: 400, headers: corsHeaders });
            }
            const storedHash = await env.ABEST_AUTH.get(`user:${userEmail}`);
            if (!storedHash) return new Response(JSON.stringify({ error: 'Benutzer nicht gefunden' }), { status: 404, headers: corsHeaders });
            // Use per-user salt if available, else legacy salt
            const existingSalt = await env.ABEST_AUTH.get(`salt:${userEmail}`) || LEGACY_SALT;
            const currentHash = await hashPassword(currentPassword, existingSalt);
            if (storedHash !== currentHash) {
                return new Response(JSON.stringify({ error: 'Aktuelles Passwort ist falsch' }), { status: 400, headers: corsHeaders });
            }
            const newSalt = generateSalt();
            const newHash = await hashPassword(newPassword, newSalt);
            await env.ABEST_AUTH.put(`salt:${userEmail}`, newSalt);
            await env.ABEST_AUTH.put(`user:${userEmail}`, newHash);
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        // ── Avatar Upload (R2) ───────────────────────────────────────────────
        if (method === 'POST' && url.pathname === '/api/auth/avatar') {
            const userEmail = await checkAuth(request, env);
            if (!userEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            if (!env.ABEST_R2) return new Response(JSON.stringify({ error: 'R2 not configured' }), { status: 500, headers: corsHeaders });

            try {
                const formData = await request.formData();
                const file = formData.get('file');
                if (!file) {
                    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: corsHeaders });
                }

                // Validate content type
                if (!file.type.startsWith('image/')) {
                    return new Response(JSON.stringify({ error: 'File must be an image' }), { status: 400, headers: corsHeaders });
                }

                // Validate file size (50 MB)
                if (file.size > 50 * 1024 * 1024) {
                    return new Response(JSON.stringify({ error: 'File too large (max 50 MB)' }), { status: 413, headers: corsHeaders });
                }

                // Create R2 key: avatars/{email}/{timestamp}-{filename}
                const timestamp = Date.now();
                const filename = file.name || 'avatar';
                const r2Key = `avatars/${userEmail}/${timestamp}-${filename}`;

                // Upload to R2
                const arrayBuffer = await file.arrayBuffer();
                await env.ABEST_R2.put(r2Key, arrayBuffer, {
                    httpMetadata: {
                        contentType: file.type
                    }
                });

                // Update profile with avatar key
                if (env.ABEST_AUTH) {
                    const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
                    const profile = profileStr ? JSON.parse(profileStr) : { email: userEmail, role: 'User' };
                    profile.avatar = r2Key;
                    await env.ABEST_AUTH.put(`profile:${userEmail}`, JSON.stringify(profile));
                }

                return new Response(JSON.stringify({ success: true, avatarUrl: '/api/auth/avatar' }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        // ── Get Avatar ───────────────────────────────────────────────────────
        if (method === 'GET' && url.pathname.startsWith('/api/auth/avatar')) {
            const pathParts = url.pathname.split('/');
            let targetEmail = null;

            // Check if requesting specific user's avatar: /api/auth/avatar/user@email.com
            if (pathParts.length > 4) {
                targetEmail = pathParts[4];
                const userEmail = await checkAuth(request, env);
                if (!userEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

                // Only admin can request other users' avatars
                let isAdmin = userEmail === 'admin';
                if (!isAdmin && env.ABEST_AUTH) {
                    const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
                    if (profileStr) {
                        const p = JSON.parse(profileStr);
                        isAdmin = (p.role === 'Admin' || p.role === 'Superadmin');
                    }
                }
                if (!isAdmin) {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
                }
            } else {
                // Own avatar
                targetEmail = await checkAuth(request, env);
                if (!targetEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            }

            if (!env.ABEST_AUTH || !env.ABEST_R2) {
                return new Response(JSON.stringify({ error: 'Storage not configured' }), { status: 500, headers: corsHeaders });
            }

            try {
                const profileStr = await env.ABEST_AUTH.get(`profile:${targetEmail}`);
                if (!profileStr) {
                    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: corsHeaders });
                }

                const profile = JSON.parse(profileStr);
                if (!profile.avatar) {
                    return new Response(JSON.stringify({ error: 'No avatar' }), { status: 404, headers: corsHeaders });
                }

                // Fetch from R2
                const object = await env.ABEST_R2.get(profile.avatar);
                if (!object) {
                    return new Response(JSON.stringify({ error: 'Avatar not found in storage' }), { status: 404, headers: corsHeaders });
                }

                const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
                return new Response(object.body, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=3600'
                    }
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        // ── User Settings (GET) ──────────────────────────────────────────────
        if (method === 'GET' && url.pathname === '/api/auth/settings') {
            const userEmail = await checkAuth(request, env);
            if (!userEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

            if (env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
                const profile = profileStr ? JSON.parse(profileStr) : {};

                // Default settings
                const defaultSettings = {
                    language: 'auto',
                    theme: 'dark',
                    emailNotifications: true,
                    marketingEmails: false,
                    profileVisibility: 'private',
                    timezone: 'auto',
                    dateFormat: 'DD.MM.YYYY',
                    twoFactorEnabled: false
                };

                const settings = profile.settings ? { ...defaultSettings, ...profile.settings } : defaultSettings;
                return new Response(JSON.stringify(settings), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
            return new Response(JSON.stringify({ error: 'Storage missing' }), { status: 500, headers: corsHeaders });
        }

        // ── User Settings (PUT) ──────────────────────────────────────────────
        if (method === 'PUT' && url.pathname === '/api/auth/settings') {
            const userEmail = await checkAuth(request, env);
            if (!userEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

            if (!env.ABEST_AUTH) return new Response(JSON.stringify({ error: 'Storage missing' }), { status: 500, headers: corsHeaders });

            try {
                const updates = await request.json();
                const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
                const profile = profileStr ? JSON.parse(profileStr) : { email: userEmail, role: 'User' };

                // Default settings
                const defaultSettings = {
                    language: 'auto',
                    theme: 'dark',
                    emailNotifications: true,
                    marketingEmails: false,
                    profileVisibility: 'private',
                    timezone: 'auto',
                    dateFormat: 'DD.MM.YYYY',
                    twoFactorEnabled: false
                };

                // Merge with existing or defaults
                const existingSettings = profile.settings ? { ...defaultSettings, ...profile.settings } : defaultSettings;
                const newSettings = { ...existingSettings, ...updates };
                profile.settings = newSettings;

                await env.ABEST_AUTH.put(`profile:${userEmail}`, JSON.stringify(profile));
                return new Response(JSON.stringify({ success: true, settings: newSettings }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// --- CONTACT FORM API HANDLER ---
// --- BEHAVIOR / PERSONALIZATION API ---
async function handleBehaviorApi(request, env) {
    const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const userEmail = await checkAuth(request, env);
    if (!userEmail) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

    const HALF_LIFE = 7;
    const LAMBDA    = Math.LN2 / HALF_LIFE;

    function decay(isoDate) {
        const ageDays = (Date.now() - new Date(isoDate).getTime()) / 86400000;
        return Math.exp(-LAMBDA * ageDays);
    }

    if (request.method === 'POST') {
        try {
            const body = await request.json();
            const incoming = body.scores || {};
            const key = 'behavior:' + userEmail;
            const existing = JSON.parse(await env.ABEST_AUTH.get(key) || '{"scores":{}}');

            // Merge: keep highest decayed score per category
            for (const [k, v] of Object.entries(incoming)) {
                if (!existing.scores[k]) {
                    existing.scores[k] = v;
                } else {
                    // If incoming is newer and has higher score, prefer it
                    const existDecayed = existing.scores[k].score * decay(existing.scores[k].lastSeen);
                    const inDecayed    = (v.score || 0) * decay(v.lastSeen || new Date().toISOString());
                    if (inDecayed > existDecayed) existing.scores[k] = v;
                }
            }
            existing.lastUpdated = new Date().toISOString();
            await env.ABEST_AUTH.put(key, JSON.stringify(existing));
            return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
        }
    }

    if (request.method === 'GET') {
        try {
            const key  = 'behavior:' + userEmail;
            const data = JSON.parse(await env.ABEST_AUTH.get(key) || '{"scores":{}}');
            // Return decayed scores for client-side personalization
            const result = Object.entries(data.scores || {}).map(([k, v]) => ({
                key: k,
                score: Math.round((v.score || 0) * decay(v.lastSeen || new Date().toISOString()) * 100) / 100,
                count: v.count || 0,
            })).sort((a, b) => b.score - a.score);
            return new Response(JSON.stringify({ scores: result }), { headers: { ...cors, 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
        }
    }

    return new Response('Method Not Allowed', { status: 405, headers: cors });
}

async function handleContactApi(request, env) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

    try {
        const body = await request.json();
        const { name, email, phone, message } = body;

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: 'Required fields missing' }), {
                status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        const id = crypto.randomUUID();
        const entry = {
            id,
            name,
            email,
            phone: phone || '',
            message,
            date: new Date().toISOString(),
            status: 'Neu',
            type: 'contact'
        };

        if (env.ABEST_INQUIRIES) {
            await env.ABEST_INQUIRIES.put(`contact:${id}`, JSON.stringify(entry));
        }

        // Email notification (fire-and-forget)
        sendBrevoNotification(env,
            `📩 Neue Kontaktanfrage von ${name}`,
            `<h2>Neue Kontaktanfrage</h2>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
             ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
             <p><strong>Nachricht:</strong></p>
             <blockquote style="border-left:3px solid #007bff;padding-left:12px;color:#555">${message.replace(/\n/g,'<br>')}</blockquote>
             <p style="color:#888;font-size:12px">Eingegangen: ${entry.date}</p>`
        );

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// --- TEAM API HANDLER ---
async function handleTeamApi(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const VALID_ROLES = ['Assistant', 'Accountant', 'Marketing Manager', 'Team Member', 'Administrator'];

    try {
        const ownerEmail = await checkAuth(request, env);
        if (!ownerEmail) return unauthorizedResponse();

        const teamKey = `team:${ownerEmail}`;
        const loadTeam = async () => {
            const raw = await env.ABEST_AUTH.get(teamKey);
            return raw ? JSON.parse(raw) : [];
        };

        if (method === 'GET') {
            const members = await loadTeam();
            return new Response(JSON.stringify(members), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (method === 'POST') {
            const body = await request.json();
            const { email, role, name } = body;
            if (!email || !role) return new Response(JSON.stringify({ error: 'email and role required' }), { status: 400, headers: corsHeaders });
            if (!VALID_ROLES.includes(role)) return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: corsHeaders });
            if (email === ownerEmail) return new Response(JSON.stringify({ error: 'Cannot add yourself' }), { status: 400, headers: corsHeaders });

            const members = await loadTeam();
            if (members.find(m => m.email === email)) return new Response(JSON.stringify({ error: 'Already in team' }), { status: 409, headers: corsHeaders });

            let memberName = name || '';
            if (!memberName && env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${email}`);
                if (profileStr) memberName = JSON.parse(profileStr).name || '';
            }

            members.push({ email, name: memberName, role, addedAt: new Date().toISOString() });
            await env.ABEST_AUTH.put(teamKey, JSON.stringify(members));

            if (env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${email}`);
                const profile = profileStr ? JSON.parse(profileStr) : { email };
                profile.role = role;
                profile.teamOwner = ownerEmail;
                await env.ABEST_AUTH.put(`profile:${email}`, JSON.stringify(profile));
            }

            return new Response(JSON.stringify({ success: true, member: { email, name: memberName, role } }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (method === 'PUT') {
            const targetEmail = decodeURIComponent(url.pathname.replace('/api/team/', ''));
            const { role } = await request.json();
            if (!role || !VALID_ROLES.includes(role)) return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: corsHeaders });

            const members = await loadTeam();
            const member = members.find(m => m.email === targetEmail);
            if (!member) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });

            member.role = role;
            await env.ABEST_AUTH.put(teamKey, JSON.stringify(members));

            if (env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${targetEmail}`);
                if (profileStr) {
                    const profile = JSON.parse(profileStr);
                    profile.role = role;
                    await env.ABEST_AUTH.put(`profile:${targetEmail}`, JSON.stringify(profile));
                }
            }
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        if (method === 'DELETE') {
            const targetEmail = decodeURIComponent(url.pathname.replace('/api/team/', ''));
            let members = await loadTeam();
            const before = members.length;
            members = members.filter(m => m.email !== targetEmail);
            if (members.length === before) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
            await env.ABEST_AUTH.put(teamKey, JSON.stringify(members));

            if (env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${targetEmail}`);
                if (profileStr) {
                    const profile = JSON.parse(profileStr);
                    if (profile.teamOwner === ownerEmail) {
                        profile.role = 'User';
                        delete profile.teamOwner;
                        await env.ABEST_AUTH.put(`profile:${targetEmail}`, JSON.stringify(profile));
                    }
                }
            }
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }

        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// --- ROLE DATA API HANDLER ---
async function handleRoleApi(request, env) {
    const method = request.method;
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        const userEmail = await checkAuth(request, env);
        if (!userEmail) return unauthorizedResponse();

        if (method === 'GET') {
            const raw = await env.ABEST_AUTH.get(`role_data:${userEmail}`);
            return new Response(raw || 'null', {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (method === 'POST') {
            const VALID_ROLES = ['founder', 'investor', 'capital', 'seller', 'explorer'];
            let role, title, description, fileInfo = null;

            const contentType = request.headers.get('Content-Type') || '';

            if (contentType.includes('multipart/form-data')) {
                // Handle file upload via FormData
                const formData = await request.formData();
                role        = formData.get('role');
                title       = formData.get('title') || '';
                description = formData.get('description') || '';
                const file  = formData.get('file');

                if (file && file.size > 0) {
                    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
                    if (file.size > MAX_SIZE) {
                        return new Response(JSON.stringify({ error: 'File too large (max 50 MB)' }), { status: 400, headers: corsHeaders });
                    }
                    // Store file in R2 if binding exists
                    if (env.ABEST_R2) {
                        const fileKey = `uploads/${userEmail}/${Date.now()}_${file.name}`;
                        await env.ABEST_R2.put(fileKey, file.stream(), {
                            httpMetadata: { contentType: file.type || 'application/octet-stream' }
                        });
                        fileInfo = { name: file.name, size: file.size, type: file.type, key: fileKey, uploadedAt: new Date().toISOString() };
                    } else {
                        // No R2: just save metadata
                        fileInfo = { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() };
                    }
                }
            } else {
                // JSON fallback
                const body = await request.json();
                role        = body.role;
                title       = body.data?.title || '';
                description = body.data?.description || '';
            }

            if (!role || !VALID_ROLES.includes(role)) {
                return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400, headers: corsHeaders });
            }

            const entry = {
                role,
                data: { title, description, fileName: fileInfo?.name || null },
                fileInfo,
                email: userEmail,
                updatedAt: new Date().toISOString()
            };
            await env.ABEST_AUTH.put(`role_data:${userEmail}`, JSON.stringify(entry));

            // Tag the profile with interest role for admin overview
            const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
            const profile = profileStr ? JSON.parse(profileStr) : { email: userEmail };
            profile.interestRole = role;
            await env.ABEST_AUTH.put(`profile:${userEmail}`, JSON.stringify(profile));

            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

// ── Capital deposit append logic ──────────────────────────────────────────────
async function handleCapitalDeposit(userEmail, formData, env) {
    const appendMode = formData.get('append_deposit') === 'true';
    const descStr = formData.get('description') || '{}';
    let newDeposit;
    try { newDeposit = JSON.parse(descStr); } catch(e) { newDeposit = {}; }
    newDeposit.id = Date.now().toString();
    newDeposit.status = 'pending';

    const key = `role_data:${userEmail}`;
    const existing = await env.ABEST_AUTH.get(key);
    let roleData = existing ? JSON.parse(existing) : { role: 'capital', deposits: [] };

    if (!roleData.deposits) roleData.deposits = [];
    if (appendMode) {
        roleData.deposits.push(newDeposit);
    } else {
        // First time submit
        roleData = { role: 'capital', deposits: [newDeposit] };
    }
    roleData.role = 'capital';
    await env.ABEST_AUTH.put(key, JSON.stringify(roleData));

    // Also update profile interestRole
    const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
    if (profileStr) {
        const profile = JSON.parse(profileStr);
        profile.interestRole = 'capital';
        await env.ABEST_AUTH.put(`profile:${userEmail}`, JSON.stringify(profile));
    }
    return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
}

// ── Seller Listings API ──────────────────────────────────────────────────────
async function handleListingsApi(request, env) {
    const method = request.method;
    const url = new URL(request.url);
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        const userEmail = await checkAuth(request, env);
        if (!userEmail) return unauthorizedResponse();

        // POST /api/listings — create new listing
        if (method === 'POST') {
            const contentType = request.headers.get('Content-Type') || '';
            let data = {};
            if (contentType.includes('multipart/form-data')) {
                const fd = await request.formData();
                for (const [k, v] of fd.entries()) {
                    if (k !== 'file') data[k] = v;
                }
                // Store file in R2 if available
                const file = fd.get('file');
                if (file && file.size > 0 && env.ABEST_R2) {
                    const fileKey = `listings/${userEmail}/${Date.now()}_${file.name}`;
                    await env.ABEST_R2.put(fileKey, file.stream(), {
                        httpMetadata: { contentType: file.type || 'application/octet-stream' }
                    });
                    data.fileKey = fileKey;
                    data.fileName = file.name;
                }
            } else {
                data = await request.json();
            }

            const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
            data.id = id;
            data.seller = userEmail;
            data.createdAt = new Date().toISOString();
            data.status = 'active';

            // Store listing
            await env.ABEST_AUTH.put(`listing:${id}`, JSON.stringify(data));

            // Append to user's listing index
            const idxRaw = await env.ABEST_AUTH.get(`listings:${userEmail}`);
            const idx = idxRaw ? JSON.parse(idxRaw) : [];
            idx.push(id);
            await env.ABEST_AUTH.put(`listings:${userEmail}`, JSON.stringify(idx));

            return new Response(JSON.stringify({ ok: true, id }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // GET /api/listings — get user's listings (or all if admin)
        if (method === 'GET') {
            let isAdmin = userEmail === 'admin';
            if (!isAdmin && env.ABEST_AUTH) {
                const profileStr = await env.ABEST_AUTH.get(`profile:${userEmail}`);
                if (profileStr) {
                    const p = JSON.parse(profileStr);
                    isAdmin = (p.role === 'Admin' || p.role === 'Superadmin');
                }
            }

            if (isAdmin && url.searchParams.get('all') === '1') {
                // Return all listings
                const list = await env.ABEST_AUTH.list({ prefix: 'listing:' });
                const listings = [];
                for (const key of list.keys) {
                    const v = await env.ABEST_AUTH.get(key.name);
                    if (v) listings.push(JSON.parse(v));
                }
                listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                return new Response(JSON.stringify(listings), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // Return user's own listings
            const idxRaw = await env.ABEST_AUTH.get(`listings:${userEmail}`);
            const ids = idxRaw ? JSON.parse(idxRaw) : [];
            const listings = [];
            for (const id of ids) {
                const v = await env.ABEST_AUTH.get(`listing:${id}`);
                if (v) listings.push(JSON.parse(v));
            }
            return new Response(JSON.stringify(listings), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // DELETE /api/listings/:id
        if (method === 'DELETE') {
            const id = url.pathname.split('/').pop();
            const v = await env.ABEST_AUTH.get(`listing:${id}`);
            if (!v) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
            const listing = JSON.parse(v);
            if (listing.seller !== userEmail && userEmail !== 'admin') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
            }
            await env.ABEST_AUTH.delete(`listing:${id}`);
            const idxRaw = await env.ABEST_AUTH.get(`listings:${listing.seller}`);
            if (idxRaw) {
                const idx = JSON.parse(idxRaw).filter(i => i !== id);
                await env.ABEST_AUTH.put(`listings:${listing.seller}`, JSON.stringify(idx));
            }
            return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    } catch(err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

// ── Payout Request API ───────────────────────────────────────────────────────
async function handlePayoutApi(request, env) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Require authentication
    const userEmail = await checkAuth(request, env);
    if (!userEmail) return unauthorizedResponse();

    if (!env.ABEST_AUTH) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
            status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    try {
        const body = await request.json();
        const type = body.type || 'balance';   // 'interest' or 'balance'
        const currency = body.currency || 'EUR';

        // Record payout request under the user's role data
        const key = `role_data:${userEmail}`;
        const existing = await env.ABEST_AUTH.get(key);
        const roleData = existing ? JSON.parse(existing) : {};

        if (!roleData.payoutRequests) roleData.payoutRequests = [];
        roleData.payoutRequests.push({
            id: crypto.randomUUID(),
            type,
            currency,
            status: 'pending',
            requestedAt: new Date().toISOString(),
        });

        await env.ABEST_AUTH.put(key, JSON.stringify(roleData));

        return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    } catch(err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
