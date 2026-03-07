export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const host = url.hostname;
        const pathname = url.pathname;

        // --- 1. STATIC ASSET CHECK (Optimized for Cloudflare Pages) ---
        // If the request is for a file with an extension, or common static paths, 
        // let the Pages asset fetcher handle it directly.
        if (pathname.includes('.') || pathname.startsWith('/assets/')) {
            return env.ASSETS.fetch(request);
        }

        // --- 2. BASIC AUTHENTICATION MIDDLEWARE ---
        // Protect /admin and sensitive API routes
        const isAuthRequired = pathname.startsWith('/admin') ||
            (pathname.startsWith('/api/inquiries') && ['GET', 'PUT', 'DELETE'].includes(request.method));

        if (isAuthRequired) {
            const authHeader = request.headers.get('Authorization');
            const expectedUser = env.ADMIN_USER || 'admin';
            const expectedPass = env.ADMIN_PASS || 'abest2026';
            const expectedAuth = 'Basic ' + btoa(`${expectedUser}:${expectedPass}`);

            if (authHeader !== expectedAuth) {
                return new Response('Unauthorized', {
                    status: 401,
                    headers: { 'WWW-Authenticate': 'Basic realm="aBest.co Admin Area"' }
                });
            }
        }

        // --- 3. API ROUTES FOR INQUIRIES ---
        if (pathname.startsWith('/api/inquiries')) {
            return handleInquiriesApi(request, env);
        }

        // --- 4. 301 REDIRECTS FOR OLD DOMAINS ---
        if (host === 'abest.com' || host === 'www.abest.com') {
            const newUrl = new URL(request.url);
            newUrl.hostname = 'abest.co';
            newUrl.protocol = 'https:';
            return Response.redirect(newUrl.toString(), 301);
        }

        // --- 5. DEFAULT STATIC SERVING ---
        // For standard paths (like /de/ or /en/kontakt.html), serve from assets.
        // Cloudflare Pages handles index.html resolution automatically for directories.
        return env.ASSETS.fetch(request);
    },
};

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
