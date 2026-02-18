import { defineMiddleware } from 'astro/middleware';
import {
    TenantService,
    AuthService,
    CryptoService,
    NotionService,
    AnalyticsService,
    SessionService // Used for fallback if needed, but AuthService handles auth
} from '@notionglaze/core';

export const onRequest = defineMiddleware(async (context, next) => {
    const { request, locals, url } = context;
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB;

    // Services
    let tenantService: TenantService | null = null;
    let authService: AuthService | null = null;

    if (db) {
        tenantService = new TenantService(db);
        authService = new AuthService(db);
    }

    // 0. Active Health Probe Support
    if (url.pathname === '/_notion_glaze_health') {
        return new Response(JSON.stringify({
            healthy: true,
            host: url.hostname,
            timestamp: Date.now()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 1. Host Resolution (Support Proxy Header)
    const proxiedHost = request.headers.get('X-NotionGlaze-Host');
    const host = (proxiedHost || url.hostname).toLowerCase();

    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isAppSubdomain = host === 'app.notionglaze.cc' || host === 'app-dev.notionglaze.cc';
    const isMainDomain = host === 'notionglaze.cc' || host === 'www.notionglaze.cc';
    const isPagesDomain = host.endsWith('.pages.dev') && !proxiedHost;

    const isSystemDomain = isLocalhost || isAppSubdomain || isMainDomain || isPagesDomain;
    const isDashboardDomain = isAppSubdomain || (isLocalhost && !url.searchParams.has('blog'));

    // 2. Session Handling
    const cookies = request.headers.get('cookie');
    const sessionId = cookies?.split(';').find(c => c.trim().startsWith('session_id='))?.split('=')[1];

    let authenticatedUserId: string | null = null;

    if (authService) {
        if (sessionId) {
            if (isLocalhost && sessionId === 'test-user') {
                authenticatedUserId = 'test-user';
            } else {
                authenticatedUserId = await authService.verifySession(sessionId);
            }
        }

        // SILENT LOGIN (Recover from notion_glaze_id)
        if (!authenticatedUserId) {
            const isSecure = !isLocalhost || url.protocol === 'https:';
            const result = await authService.recoverSession(cookies, isSecure);

            if (result) {
                authenticatedUserId = result.userId;
                locals.pendingAuthCookies = result.cookies;
            }
        }
    }

    // DEVELOPMENT FALLBACK
    if (!authenticatedUserId && isLocalhost) {
        authenticatedUserId = 'test-user';
    }

    locals.userId = authenticatedUserId;
    locals.isSystemDomain = isSystemDomain;
    locals.isDashboardDomain = isDashboardDomain;
    locals.hostResolutionMethod = proxiedHost ? 'Proxy Header (X-NotionGlaze-Host)' : 'Direct Request';

    // 3. System Domain Handling
    if (isDashboardDomain && tenantService && authService) {
        if (url.pathname === '/') {
            return context.redirect('/dashboard');
        }
        if (url.pathname === '/login') {
            if (locals.userId) {
                return context.redirect('/dashboard');
            }
        }
        if (url.pathname.startsWith('/dashboard')) {
            if (!locals.userId) {
                return context.redirect('/login');
            }
        }

        if (authenticatedUserId) {
            try {
                // For 'test-user', we might not have a tenant.
                // Or maybe we treat 'test-user' as special ID?
                // The middleware logic before had tenant lookup logic.

                // If test-user, we might skip DB lookup for tenant if tenantService expects UUID.
                // But let's assume getTenantByOwnerId handles 'test-user' if it exists in DB, or returns null.

                let tenant = await tenantService.getTenantByOwnerId(authenticatedUserId);

                if (!tenant && authenticatedUserId !== 'test-user') {
                    // HEALING LOGIC: If tenant exists by ID (same as user ID usually for Notion users), fix owner_id
                    // But authenticatedUserId is internal UUID from users table.
                    // The previous logic looked up by owner_id which is user.id.

                    // Wait, previous logic:
                    // userRecord = sessionService.getUserByNotionId(authenticatedUserId); // Wait, verifySession returns userId (internal UUID).
                    // So authenticatedUserId IS internal UUID.
                    // If tenant not found by owner_id (internal UUID), maybe tenant has old owner_id or none?
                    // Previous logic tried to heal by checking if userRecord exists and tenant exists by ID matching userRecord.id?
                    // But verifySession returns internal UUID.
                    // Previous logic:
                    /*
                    let tenant = await tenantService.getTenantByOwnerId(authenticatedUserId);
                    if (!tenant) {
                        const userRecord = await sessionService.getUserByNotionId(authenticatedUserId); // Wait, getUserByNotionId takes Notion ID.
                        // But authenticatedUserId is internal ID.
                        // So previous logic was likely confused or I misread it.
                    }
                    */
                   // Actually, previous logic in middleware.ts:
                   // authenticatedUserId was user_id from session (internal UUID).
                   // userRecord = await sessionService.getUserByNotionId(authenticatedUserId);
                   // This implies authenticatedUserId was treated as Notion ID?
                   // No, session.user_id stores internal UUID.
                   // So sessionService.getUserByNotionId(internalUUID) would fail unless internalUUID == NotionID.
                   // But in verify.ts, internalUUID = crypto.randomUUID().
                   // So previous healing logic was likely flawed or specific to legacy data.

                   // I will keep it simple: getTenantByOwnerId.
                   // If tenant is missing, user sees empty dashboard or onboarding.
                }

                if (tenant) {
                    locals.tenantId = tenant.id;
                    locals.tenant = tenant;
                    if (tenant.config_json) {
                        try {
                            locals.siteConfig = JSON.parse(tenant.config_json);
                        } catch (e) { }
                    }

                    // ASYNC TOKEN VALIDATION (non-blocking, but guaranteed to complete)
                    if (tenant.notion_access_token) {
                        const encryptionSecret = runtime?.env?.ENCRYPTION_SECRET;
                        if (encryptionSecret) {
                            const cryptoService = new CryptoService(encryptionSecret);
                            const validationPromise = tenantService.validateAndHandleTokenStatus(
                                tenant,
                                encryptionSecret,
                                cryptoService,
                                (token) => new NotionService(token)
                            );
                            runtime?.context?.waitUntil(validationPromise);
                        }
                    }
                }
            } catch (e) {
                console.error('Middleware Dashboard Tenant Resolution Error:', e);
            }
        }
    }

    // 4. Tenant Resolution (Only for Non-System Domains)
    let tenantId = (isLocalhost && !isAppSubdomain) ? 'test-user' : null;

    if (!isSystemDomain && tenantService) {
        try {
            let resolvedTenant = null;
            let searchHost = host;

            if (searchHost.startsWith('www.')) {
                searchHost = searchHost.substring(4);
            }

            if (host.endsWith('.notionglaze.cc')) {
                const subdomain = searchHost.split('.')[0];
                resolvedTenant = await tenantService.getTenantBySubdomain(subdomain);
            } else {
                resolvedTenant = await tenantService.getTenantByCustomDomain(searchHost);
            }

            if (resolvedTenant) {
                const isPro = resolvedTenant.plan === 'pro';
                locals.tenantPlan = resolvedTenant.plan;

                if (!host.endsWith('.notionglaze.cc') && !isPro) {
                    return new Response("Domain configuration error or plan not found. Please visit notionglaze.cc", { status: 404 });
                }

                tenantId = resolvedTenant.id;
                try {
                    locals.siteConfig = JSON.parse(resolvedTenant.config_json || '{}') || {};
                } catch (pe) {
                    console.error('Config JSON Parse Error:', pe);
                    locals.siteConfig = {};
                }
            }
        } catch (de) {
            console.error('Tenant Resolution DB Error:', de);
        }
    }

    locals.blogTenantId = tenantId;
    if (!locals.siteConfig) {
        locals.siteConfig = {};
    }

    // 5. Internal Routing for Blogs
    const isBlogPreview = isLocalhost && url.searchParams.has('blog');
    const isApiOrAsset = url.pathname.startsWith('/api') || url.pathname.startsWith('/_') || url.pathname.startsWith('/favicon');

    if (tenantId && (!isSystemDomain || isBlogPreview) && !url.pathname.startsWith('/blog') && !isApiOrAsset) {
        const newUrl = new URL(url);
        newUrl.pathname = `/blog${url.pathname === '/' ? '' : url.pathname}`;
        locals.internalRewrite = newUrl.pathname;

        // ANALYTICS LOGGING
        if (db) {
            (async () => {
                try {
                    const analyticsService = new AnalyticsService(db);
                    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
                    const ua = request.headers.get('User-Agent') || 'unknown';
                    const viewerHash = btoa(`${ip}-${ua}`).substring(0, 32);

                    await analyticsService.logView({
                        tenantId: tenantId as string,
                        path: url.pathname,
                        viewerHash,
                        referrer: request.headers.get('Referer') || undefined
                    });
                } catch (ae) {
                    console.error('Analytics Logging Error:', ae);
                }
            })();
        }

        return context.rewrite(newUrl);
    }

    const response = await next();

    // Set pending cookies (for silent login)
    if (locals.pendingAuthCookies) {
        locals.pendingAuthCookies.forEach(cookie => {
            response.headers.append('Set-Cookie', `${cookie.name}=${cookie.value}; ${cookie.attributes}`);
        });
    }

    return response;
});
