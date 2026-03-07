export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        const host = url.hostname;

        // --- 1. LANGUAGE REDIRECTION FOR ROOT (/) ---
        if (pathname === '/') {
            const acceptLanguage = request.headers.get('Accept-Language') || 'en';
            const langCode = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
            const supportedLangs = ["en", "de", "tr", "es", "zh", "hi", "ar", "fr", "ru", "pt", "ur", "ku", "he", "hy"];
            const targetLang = supportedLangs.includes(langCode) ? langCode : 'en';
            return Response.redirect(`https://${host}/${targetLang}/`, 302);
        }

        // --- 2. API ROUTES ---
        if (pathname.startsWith('/api/inquiries')) {
            // Check auth for sensitive methods
            if (['GET', 'PUT', 'DELETE'].includes(request.method)) {
                if (!checkAuth(request, env)) return unauthorizedResponse();
            }
            return handleInquiriesApi(request, env);
        }

        // --- 2. ADMIN AREA ---
        if (pathname.startsWith('/admin')) {
            if (!checkAuth(request, env)) return unauthorizedResponse();
            // Let ASSETS handle the static files in /admin
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
function checkAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    const expectedUser = env.ADMIN_USER;
    const expectedPass = env.ADMIN_PASS;

    if (!expectedUser || !expectedPass) {
        console.error("Security Warning: ADMIN_USER or ADMIN_PASS environment variables are missing.");
        return false; // Fail secure
    }

    const expectedAuth = 'Basic ' + btoa(`${expectedUser}:${expectedPass}`);
    return authHeader === expectedAuth;
}

function unauthorizedResponse() {
    return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="aBest.co Admin Area"' }
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
