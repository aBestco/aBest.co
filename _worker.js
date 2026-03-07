export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const host = url.hostname;

        // Check if the request is for the old domains
        if (host === 'abest.com' || host === 'www.abest.com') {
            // Create new URL pointing to the primary domain
            const newUrl = new URL(request.url);
            newUrl.hostname = 'abest.co';
            newUrl.protocol = 'https:';

            // Perform a permanent 301 redirect
            return Response.redirect(newUrl.toString(), 301);
        }

        // Otherwise, serve static assets as normal
        return env.ASSETS.fetch(request);
    },
};
