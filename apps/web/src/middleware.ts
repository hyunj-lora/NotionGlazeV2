import { defineMiddleware, sequence } from 'astro:middleware';
import {
    TenantService,
    AnalyticsService,
} from '@notionglaze/core';

/**
 * 0. Active Health Probe Support
 * Handles requests to /_notion_glaze_health
 */
const healthMiddleware = defineMiddleware(async ({ url }, next) => {
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
    return next();
});

/**
 * 1. Host Resolution
 * Determines host, environment status, and identifies if the request is for a system domain.
 */
const hostResolutionMiddleware = defineMiddleware(async ({ request, url, locals }, next) => {
    const proxiedHost = request.headers.get('X-NotionGlaze-Host');
    const host = (proxiedHost || url.hostname).toLowerCase();

    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isAppSubdomain = host === 'app.notionglaze.cc' || host === 'app-dev.notionglaze.cc';
    const isMainDomain = host === 'notionglaze.cc' || host === 'www.notionglaze.cc';
    const isPagesDomain = host.endsWith('.pages.dev') && !proxiedHost;

    const isSystemDomain = isLocalhost || isAppSubdomain || isMainDomain || isPagesDomain;
    const isDashboardDomain = isAppSubdomain || (isLocalhost && !url.searchParams.has('blog'));

    locals.isSystemDomain = isSystemDomain;
    locals.isDashboardDomain = isDashboardDomain;
    locals.hostResolutionMethod = proxiedHost ? 'Proxy Header (X-NotionGlaze-Host)' : 'Direct Request';

    // Store raw host for subsequent filters
    (locals as any)._host = host;
    (locals as any)._isLocalhost = isLocalhost;

    return next();
});

/**
 * 2. Session Handling
 * Extracts authenticated user session via Auth.js
 */
const authMiddleware = defineMiddleware(async (context, next) => {
    let authenticatedUserId: string | null = null;
    let authSession: any = null;

    try {
        authSession = await context.locals.auth();
    } catch (e) { /* ignore */ }

    if (authSession?.user?.email) {
        authenticatedUserId = authSession.user.email;
    }

    // DEVELOPMENT FALLBACK
    if (!authenticatedUserId && (context.locals as any)._isLocalhost && context.url.pathname !== '/login') {
        authenticatedUserId = 'test-user';
    }

    context.locals.userId = authenticatedUserId;
    return next();
});

/**
 * 3. Dashboard and System Logic
 * Manages routing and tenant resolution when on a system/dashboard domain.
 */
const dashboardMiddleware = defineMiddleware(async (context, next) => {
    const { url, locals, redirect } = context;
    const { isDashboardDomain, userId } = locals;
    const db = locals.runtime.env.DB;

    if (!isDashboardDomain || !db) return next();

    const tenantService = new TenantService(db);

    if (url.pathname === '/') return redirect('/dashboard');
    if (url.pathname === '/login' && userId) return redirect('/dashboard');
    if (url.pathname.startsWith('/dashboard') && !userId) return redirect('/login');

    if (userId) {
        try {
            const tenant = await tenantService.getOrCreateTenantByOwnerId(userId);
            if (tenant) {
                locals.tenantId = tenant.id;
                locals.tenant = tenant;
                if (tenant.config_json) {
                    try { locals.siteConfig = JSON.parse(tenant.config_json); } catch (e) { }
                }

                // Redirect to onboarding if no connection
                const hasConnection = !!tenant.public_link_url || !!tenant.notion_access_token;
                const isSetupPage = url.pathname === '/dashboard/select-database';
                if (!hasConnection && !isSetupPage && url.pathname.startsWith('/dashboard')) {
                    return redirect('/dashboard/select-database');
                }

                // legacy logic removed (using public_link for rendering)
            }
        } catch (e) {
            console.error('Middleware Dashboard Tenant Resolution Error:', e);
        }
    }

    return next();
});

/**
 * 4. Blog Resolution
 * Resolves tenants for custom domains and subdomains.
 */
const blogResolutionMiddleware = defineMiddleware(async (context, next) => {
    const { locals } = context;
    const { isSystemDomain, runtime } = locals;
    const host = (locals as any)._host;
    const db = runtime.env.DB;

    if (isSystemDomain || !db) {
        locals.blogTenantId = ((locals as any)._isLocalhost && !locals.isDashboardDomain) ? 'test-user' : null;
        return next();
    }

    const tenantService = new TenantService(db);
    try {
        let resolvedTenant = null;
        let searchHost = host;

        if (searchHost.startsWith('www.')) searchHost = searchHost.substring(4);

        if (host.endsWith('.notionglaze.cc')) {
            const subdomain = searchHost.split('.')[0];
            resolvedTenant = await tenantService.getTenantBySubdomain(subdomain);
        } else {
            resolvedTenant = await tenantService.getTenantByCustomDomain(searchHost);
        }

        if (resolvedTenant) {
            locals.tenantPlan = resolvedTenant.plan;
            if (!host.endsWith('.notionglaze.cc') && resolvedTenant.plan !== 'pro') {
                return new Response("Domain configuration error. Pro plan required.", { status: 404 });
            }

            locals.blogTenantId = resolvedTenant.id;
            try {
                locals.siteConfig = JSON.parse(resolvedTenant.config_json || '{}') || {};
            } catch (pe) {
                locals.siteConfig = {};
            }
        }
    } catch (e) {
        console.error('Tenant Resolution DB Error:', e);
    }

    return next();
});

/**
 * 5. Internal Routing & Analytics
 * Performs internal rewrites to /blog and logs analytics.
 */
const blogRoutingMiddleware = defineMiddleware(async (context, next) => {
    const { url, locals, request } = context;
    const { blogTenantId, isSystemDomain, runtime } = locals;
    const db = runtime.env.DB;

    if (!locals.siteConfig) locals.siteConfig = {};

    const isBlogPreview = (locals as any)._isLocalhost && url.searchParams.has('blog');
    const isApiOrAsset = url.pathname.startsWith('/api') || url.pathname.startsWith('/_') || url.pathname.startsWith('/favicon');

    if (blogTenantId && (!isSystemDomain || isBlogPreview) && !url.pathname.startsWith('/blog') && !isApiOrAsset) {
        const newUrl = new URL(url);
        newUrl.pathname = `/blog${url.pathname === '/' ? '' : url.pathname}`;
        locals.internalRewrite = newUrl.pathname;

        // Analytics logging
        if (db) {
            const analyticsService = new AnalyticsService(db);
            const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
            const ua = request.headers.get('User-Agent') || 'unknown';
            const viewerHash = btoa(`${ip}-${ua}`).substring(0, 32);

            const logPromise = analyticsService.logView({
                tenantId: blogTenantId,
                path: url.pathname,
                viewerHash,
                referrer: request.headers.get('Referer') || undefined
            }).catch(e => console.error('Analytics Logging Error:', e));

            runtime.context?.waitUntil?.(logPromise);
        }

        return context.rewrite(newUrl);
    }

    return next();
});

export const onRequest = sequence(
    healthMiddleware,
    hostResolutionMiddleware,
    authMiddleware,
    dashboardMiddleware,
    blogResolutionMiddleware,
    blogRoutingMiddleware
);
