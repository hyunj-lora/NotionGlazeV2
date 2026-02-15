import type { APIRoute } from 'astro';
import { CryptoService } from "@notionglaze/core";

export const GET: APIRoute = async ({ request, redirect, locals }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const stateStr = url.searchParams.get('state');

    if (error) {
        return new Response(`OAuth Error: ${error}`, { status: 400 });
    }

    if (!code) {
        return new Response('Missing code parameter', { status: 400 });
    }

    let mode = 'login';
    if (stateStr) {
        try {
            const state = JSON.parse(stateStr);
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
    const encryptionSecret = runtime?.env?.ENCRYPTION_SECRET || 'fallback-secret-for-dev-only';
    const db = runtime?.env?.DB;

    if (!clientId || !clientSecret || !redirectUri) {
        return new Response('Missing Notion client credentials', { status: 500 });
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

        if (!db) {
            return new Response('Database connection missing', { status: 500 });
        }

        console.log('Database Operations Starting...');

        // 1. Find or Create Internal User (Both modes need a user)
        let user = await db.prepare('SELECT id FROM users WHERE notion_user_id = ?').bind(notionUserId).first();
        let internalUserId = user?.id;

        if (!internalUserId) {
            internalUserId = crypto.randomUUID();
            await db.prepare(`
                INSERT INTO users (id, notion_user_id, email, name, avatar_url)
                VALUES (?, ?, ?, ?, ?)
            `).bind(internalUserId, notionUserId, notionUserEmail, notionUserName, notionUserAvatar).run();
        } else {
            // Update profile info
            await db.prepare(`
                UPDATE users SET email = ?, name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(notionUserEmail, notionUserName, notionUserAvatar, internalUserId).run();
        }

        if (mode === 'login') {
            // mode: login -> Just create session and redirect to dashboard

            // Fix: Sync Notion Workspace Name even on simple login
            try {
                const existingTenant = await db.prepare('SELECT id, config_json FROM tenants WHERE id = ?').bind(notionUserId).first();
                if (existingTenant) {
                    let currentConfig: any = {};
                    try {
                        currentConfig = JSON.parse(existingTenant.config_json);
                    } catch (e) { }

                    // Mixin new workspace details
                    const newConfig = {
                        ...currentConfig,
                        workspace_name: data.workspace_name,
                        workspace_icon: data.workspace_icon,
                        bot_id: data.bot_id
                    };

                    // Also update access token in case it rotated, and ENSURE owner_id is linked
                    await db.prepare(`
                        UPDATE tenants 
                        SET config_json = ?, notion_access_token = ?, owner_id = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `).bind(JSON.stringify(newConfig), encryptedToken, internalUserId, existingTenant.id).run();
                } else {
                    // Auto-provision if missing (Fixes 404 on API calls)
                    console.log('Auto-provisioning tenant for login mode user...');
                    const workspaceName = data.workspace_name || 'site';
                    const defaultSubdomain = `${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
                    const trialEndsAt = Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60);

                    await db.prepare(`
                        INSERT INTO tenants (id, notion_access_token, root_page_id, config_json, plan, trial_ends_at, subdomain, owner_id)
                        VALUES (?, ?, ?, ?, 'trial', ?, ?, ?)
                    `).bind(notionUserId, encryptedToken, rootPageId, configJson, trialEndsAt, defaultSubdomain, internalUserId).run();
                }
            } catch (syncErr) {
                console.error('Failed to sync tenant info during login:', syncErr);
            }

            const sessionId = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
            await db.prepare(`
                INSERT INTO sessions (id, user_id, expires_at)
                VALUES (?, ?, ?)
            `).bind(sessionId, internalUserId, expiresAt).run();

            const isSecure = !redirectUri.includes('localhost');
            const cookieAttr = `Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${isSecure ? '; Secure' : ''}`;
            const glazeCookieAttr = `Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${isSecure ? '; Secure' : ''}`;

            const responseHeaders = new Headers();
            responseHeaders.append('Set-Cookie', `session_id=${sessionId}; ${cookieAttr}`);
            responseHeaders.append('Set-Cookie', `notion_glaze_id=${internalUserId}; ${glazeCookieAttr}`);
            responseHeaders.append('Location', '/dashboard');

            return new Response(null, {
                status: 302,
                headers: responseHeaders,
            });
        } else {
            // mode: connect -> Update or Create Tenant and link to user
            // Ensure the user is the one currently logged in (extra security check could be added here)
            const currentUserId = (locals as any).userId;
            if (currentUserId && currentUserId !== internalUserId) {
                // User is trying to connect a workspace that belongs to a different Notion user than their current session
                // We'll allow it but link it to the current session user
                internalUserId = currentUserId;
            }

            const workspaceName = data.workspace_name || 'site';
            const defaultSubdomain = `${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
            const trialEndsAt = Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60);

            await db.prepare(`
                INSERT INTO tenants (id, notion_access_token, root_page_id, config_json, plan, trial_ends_at, subdomain, owner_id)
                VALUES (?, ?, ?, ?, 'trial', ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    notion_access_token = excluded.notion_access_token,
                    root_page_id = COALESCE(tenants.root_page_id, excluded.root_page_id),
                    config_json = excluded.config_json,
                    subdomain = COALESCE(tenants.subdomain, excluded.subdomain),
                    owner_id = excluded.owner_id
            `).bind(notionUserId, encryptedToken, rootPageId, configJson, trialEndsAt, defaultSubdomain, internalUserId).run();

            const isSecure = !redirectUri.includes('localhost');
            const glazeCookieAttr = `Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${isSecure ? '; Secure' : ''}`;

            const responseHeaders = new Headers();
            responseHeaders.append('Set-Cookie', `notion_glaze_id=${internalUserId}; ${glazeCookieAttr}`);
            responseHeaders.append('Location', '/dashboard/notion-source');

            return new Response(null, {
                status: 302,
                headers: responseHeaders,
            });
        }
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
