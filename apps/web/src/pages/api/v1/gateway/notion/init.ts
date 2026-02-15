import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request, redirect, locals }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') || 'login'; // 'login' or 'connect'

    const runtime = (locals as any).runtime;
    const clientId = runtime?.env?.NOTION_CLIENT_ID;
    let redirectUri = runtime?.env?.NOTION_REDIRECT_URI;

    // Smart Redirect Logic
    if (!redirectUri) {
        const host = request.headers.get('host');
        const protocol = host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https';
        if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
            redirectUri = `${protocol}://${host}/api/v1/gateway/notion/verify`;
        } else {
            redirectUri = 'https://app.notionglaze.cc/api/v1/gateway/notion/verify';
        }
    }

    if (!clientId || !redirectUri) {
        return new Response(JSON.stringify({
            error: 'Missing Notion client credentials',
            clientId: !!clientId,
            redirectUri: !!redirectUri,
            env: Object.keys(runtime?.env || {})
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const state = JSON.stringify({ mode });
    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

    return redirect(notionAuthUrl);
};
