export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. Determine the original custom host
        // Cloudflare SaaS (Custom Hostnames) sends the custom domain in the 'Host' header,
        // but sometimes we need to check X-Forwarded-Host if behind another proxy.
        const originalHost = request.headers.get('X-Forwarded-Host') ||
            request.headers.get('Host') ||
            url.hostname;

        // Route to the Pages project
        const targetHost = 'notion-glaze-landing.pages.dev';
        const targetUrl = new URL(request.url);
        targetUrl.hostname = targetHost;

        // 2. Clean up headers to avoid O2O loops or security blocks
        const newHeaders = new Headers();
        const headersToStrip = [
            'cf-ray', 'cf-connecting-ip', 'cf-visitor', 'cf-ipcountry',
            'cf-worker', 'cf-access-client-id', 'cf-access-client-secret',
            'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto'
        ];

        // 2.1 Loop Protection: Check if this request has already passed through this proxy
        const proxyHop = request.headers.get('X-NotionGlaze-Proxy-Hop') || '0';
        if (parseInt(proxyHop) > 3) {
            return new Response('O2O Loop Detected', { status: 508 });
        }

        for (const [key, value] of request.headers.entries()) {
            const lowKey = key.toLowerCase();
            if (headersToStrip.includes(lowKey) || lowKey.startsWith('cf-') || lowKey.startsWith('x-forwarded-')) {
                continue;
            }
            newHeaders.set(key, value);
        }

        // Preserve original protocol and set identifying headers
        const proto = request.headers.get('X-Forwarded-Proto') || 'https';
        newHeaders.set('X-Forwarded-Proto', proto);

        // 3. Set identification and target Host headers
        // Important: For O2O, we must signal to the origin that this is a proxied request
        newHeaders.set('X-NotionGlaze-Host', originalHost);
        newHeaders.set('Host', targetHost);
        newHeaders.set('X-NotionGlaze-Proxy-Hop', (parseInt(proxyHop) + 1).toString());
        newHeaders.set('X-Proxy-Mode', 'saas-worker');
        newHeaders.set('X-Proxy-Proxy-Version', '2.2.0-o2o-ready');

        const fetchOptions = {
            method: request.method,
            headers: newHeaders,
            redirect: 'manual'
        };

        // 3. Forward body for non-safe methods (POST, PUT, etc.)
        if (!['GET', 'HEAD'].includes(request.method)) {
            fetchOptions.body = request.body;
        }

        try {
            const response = await fetch(targetUrl.toString(), fetchOptions);

            // 4. Handle response properly
            // In O2O, we might need to adjust some response headers to prevent the browser 
            // from being confused about the origin.
            const newResponse = new Response(response.body, response);

            // Ensure security headers don't cause issues in O2O
            newResponse.headers.delete('content-security-policy'); // Let the proxy or customer control this if needed
            newResponse.headers.set('X-Proxy-Applied', 'true');

            return newResponse;
        } catch (err) {
            return new Response(`Proxy O2O Handshake Failed: ${err.message}`, {
                status: 502,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
    },
};
