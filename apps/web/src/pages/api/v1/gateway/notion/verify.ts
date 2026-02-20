import type { APIRoute } from 'astro';
import { AuthService, UserService, TenantService, CryptoService } from '@notionglaze/core';

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const stateStr = url.searchParams.get('state');

    if (error) {
        return new Response(`Notion OAuth Error: ${error}`, { status: 400 });
    }

    if (!code) {
        return new Response('Missing code parameter', { status: 400 });
    }

    let mode = 'login';
    if (stateStr) {
        try {
            const state = JSON.parse(decodeURIComponent(stateStr));
            mode = state.mode || 'login';
        } catch (e) {
            console.error('Failed to parse state:', stateStr);
        }
    }

    const runtime = (locals as any).runtime;
    const clientId = runtime?.env?.NOTION_CLIENT_ID;
    const clientSecret = runtime?.env?.NOTION_CLIENT_SECRET;
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
    const encryptionSecret = runtime?.env?.ENCRYPTION_SECRET;
    const db = runtime?.env?.DB;

    if (!clientId || !clientSecret || !redirectUri) {
        return new Response('Missing Notion client credentials', { status: 500 });
    }

    if (!db || !encryptionSecret) {
        return new Response('Database or Encryption Secret missing', { status: 500 });
    }

    console.log(`Starting Notion Token Exchange (Mode: ${mode})...`);
    try {
        const response = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        });

        const data = await response.json() as any;

        if (!response.ok) {
            console.error('Notion Token Error Response:', data);
            return new Response(`Notion Token Error: ${data.error_description || data.error}`, { status: response.status });
        }

        const notionUserId = data.owner?.user?.id;
        const notionUserName = data.owner?.user?.name;
        const notionUserAvatar = data.owner?.user?.avatar_url;
        const notionUserEmail = data.owner?.user?.person?.email;

        if (!notionUserId) {
            return new Response('Failed to get Notion User ID', { status: 500 });
        }

        const rawAccessToken = data.access_token;
        const rootPageId = data.duplicated_template_id;
        const configJson = JSON.stringify({
            workspace_id: data.workspace_id,
            workspace_name: data.workspace_name,
            workspace_icon: data.workspace_icon,
            bot_id: data.bot_id
        });

        console.log('Encrypting Token...');
        const cryptoService = new CryptoService(encryptionSecret);
        const encryptedToken = await cryptoService.encrypt(rawAccessToken);

        console.log('Database Operations Starting...');
        const tenantService = new TenantService(db);

        // We no longer create "Users" here. User accounts are created via Auth.js (Google Login).
        // This endpoint is now strictly for CONNECTING a Notion workspace to an ALREADY LOGGED IN user.
        const currentUserId = (locals as any).userId;

        if (!currentUserId) {
            return new Response('Unauthorized: You must be logged in via Google to connect a Notion Workspace.', { status: 401 });
        }

        const workspaceName = data.workspace_name || 'site';
        const defaultSubdomain = `${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
        const trialEndsAt = Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60);

        // Treat the connected workspace as a Tenant owned by the current Google User
        await tenantService.upsertTenant({
            id: notionUserId, // We still use Notion's Workspace Owner ID as the Tenant ID for uniqueness within Notion
            notion_access_token: encryptedToken,
            root_page_id: rootPageId,
            config_json: configJson,
            plan: 'trial',
            trial_ends_at: trialEndsAt,
            subdomain: defaultSubdomain,
            owner_id: currentUserId,
            connection_type: 'oauth_db' // Record the type of connection
        });

        const isSecure = !redirectUri.includes('localhost');
        const rememberMeCookieAttr = `Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${isSecure ? '; Secure' : ''}`;

        const responseHeaders = new Headers();

        // Redirect back to the dashboard settings or notion-source selection
        responseHeaders.append('Location', '/dashboard/settings');

        return new Response(null, {
            status: 302,
            headers: responseHeaders,
        });
    } catch (err: any) {
        console.error('OAuth Callback Error:', err);
        return new Response(JSON.stringify({
            error: 'Internal Server Error during OAuth callback',
            message: err.message,
            stack: err.stack,
            env: {
                hasClientId: !!clientId,
                hasClientSecret: !!clientSecret,
                hasRedirectUri: !!redirectUri,
                hasDb: !!db,
                hasEncryptionSecret: !!encryptionSecret
            }
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
