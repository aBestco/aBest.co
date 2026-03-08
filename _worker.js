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

        if (pathname.startsWith('/api/role')) {
            return handleRoleApi(request, env);
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

        // --- 3. 301 REDIRECTS ---
        if (url.hostname === 'abest.com' || url.hostname === 'www.abest.com') {
            const newUrl = new URL(request.url);
            newUrl.hostname = 'abest.co';
            return Response.redirect(newUrl.toString(), 301);
        }

        // --- 4. STATIC ASSETS & PAGES ---
        // Cloudflare Pages handles /de/, /en/index.html, /assets/ etc. automatically
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
            'WWW-Authenticate': 'Bearer realm="aBest.co Admin"',
            'Content-Type': 'application/json'
        }
    });
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

    try {
        // GET /api/inquiries : Fetch all inquiries
        if (method === 'GET' && url.pathname === '/api/inquiries') {
            const list = await env.ABEST_INQUIRIES.list();
            const inquiries = [];
            for (const key of list.keys) {
                const value = await env.ABEST_INQUIRIES.get(key.name);
                if (value) inquiries.push(JSON.parse(value));
            }
            // Sort newest first
            inquiries.sort((a, b) => new Date(b.date) - new Date(a.date));
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

            await env.ABEST_INQUIRIES.put(id, JSON.stringify(merged));
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
            const list = await env.ABEST_AUTH.list({ prefix: 'profile:' });
            const users = [];
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
            // In a real app, you'd list files from R2 or KV metadata.
            // Using KV for metadata here.
            const list = await env.ABEST_AUTH.list({ prefix: 'doc:' });
            const docs = [];
            for (const key of list.keys) {
                const docStr = await env.ABEST_AUTH.get(key.name);
                if (docStr) docs.push(JSON.parse(docStr));
            }

            // Temporary Fallback if empty
            if (docs.length === 0) {
                docs.push({ name: "Unternehmensprofil.pdf", type: "PDF", size: "1.2 MB", date: new Date().toISOString(), owner: "System" });
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

// --- PASSWORD HASHING HELPER (Simplified PBKDF2 via Web Crypto) ---
async function hashPassword(password, salt = 'abest_global_salt_2026') {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(salt),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
    const exported = await crypto.subtle.exportKey("raw", key);
    const hashBuffer = new Uint8Array(exported);
    const hashArray = Array.from(hashBuffer);
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
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

            if (env.ABEST_AUTH) {
                const storedPass = await env.ABEST_AUTH.get(`user:${email}`);
                const hashedInput = await hashPassword(password);

                if (storedPass && storedPass === hashedInput) {
                    const sessionId = crypto.randomUUID();
                    await env.ABEST_AUTH.put(`session:${sessionId}`, email, { expirationTtl: 86400 }); // 24h

                    // Ensure an empty profile exists
                    const existingProfile = await env.ABEST_AUTH.get(`profile:${email}`);
                    if (!existingProfile) {
                        await env.ABEST_AUTH.put(`profile:${email}`, JSON.stringify({ email: email, role: 'User' }));
                    }

                    return new Response(JSON.stringify({ success: true, token: sessionId, email: email }), {
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }
            }
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: corsHeaders });
        }

        if (method === 'POST' && url.pathname === '/api/auth/register') {
            const { email, password } = await request.json();

            if (env.ABEST_AUTH) {
                const exists = await env.ABEST_AUTH.get(`user:${email}`);
                if (exists) {
                    return new Response(JSON.stringify({ error: 'User already exists' }), { status: 400, headers: corsHeaders });
                }

                const hashedPassword = await hashPassword(password);
                await env.ABEST_AUTH.put(`user:${email}`, hashedPassword);
                await env.ABEST_AUTH.put(`profile:${email}`, JSON.stringify({ email: email, name: '', phone: '', company: '', role: 'User' }));

                return new Response(JSON.stringify({ success: true }), {
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

                await env.ABEST_AUTH.put(`profile:${userEmail}`, JSON.stringify(profile));
                return new Response(JSON.stringify({ success: true, profile }), {
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
            return new Response(JSON.stringify({ error: 'Storage missing' }), { status: 500, headers: corsHeaders });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
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
