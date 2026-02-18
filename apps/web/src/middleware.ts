import './lib/polyfills';
import { defineMiddleware } from 'astro:middleware';
import { recoverSessionFromCookie } from './lib/auth';
import { AnalyticsService, TenantService, SessionService, NotionService, CryptoService } from '@notionglaze/core';


export const onRequest = defineMiddleware(async (context, next) => {
    const { request, locals, url } = context;
    const runtime = locals.runtime;
    const db = runtime?.env?.DB;

    if (!db) return next();

    const tenantService = new TenantService(db);
    const sessionService = new SessionService(db);

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

    if (sessionId) {
        if (isLocalhost && sessionId === 'test-user') {
            authenticatedUserId = 'test-user';
        } else {
            try {
                const sessionRecord = await sessionService.getSession(sessionId);

                if (sessionRecord) {
                    const expiresAt = new Date(sessionRecord.expires_at).getTime();
                    if (expiresAt > Date.now()) {
                        authenticatedUserId = sessionRecord.user_id;
                    }
                }
            } catch (se) {
                console.error('Session Validation Error:', se);
            }
        }
    }

    // SILENT LOGIN
    if (!authenticatedUserId) {
        const recoveredUserId = await recoverSessionFromCookie(cookies, db);
        if (recoveredUserId) {
            const newSessionId = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            try {
                await sessionService.createSession(newSessionId, recoveredUserId, expiresAt);
                authenticatedUserId = recoveredUserId;
                locals.pendingSessionId = newSessionId;
            } catch (e) {
                console.error('Silent Login Session Creation Error:', e);
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
    if (isDashboardDomain) {
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
                let tenant = await tenantService.getTenantByOwnerId(authenticatedUserId);

                if (!tenant) {
                    // HEALING LOGIC
                    const userRecord = await sessionService.getUserByNotionId(authenticatedUserId);
                    if (userRecord?.id) {
                        tenant = await tenantService.getTenantById(userRecord.id);
                        if (tenant) {
                            await tenantService.updateOwnerId(tenant.id, authenticatedUserId);
                        }
                    }
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

    if (!isSystemDomain) {
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

        return context.rewrite(newUrl);
    }

    const response = await next();

    if (locals.pendingSessionId) {
        const isSecure = !isLocalhost || url.protocol === 'https:';
        const cookieAttr = `Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${isSecure ? '; Secure' : ''}`;
        response.headers.append('Set-Cookie', `session_id=${locals.pendingSessionId}; ${cookieAttr}`);
    }

    return response;
});
