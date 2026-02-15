import type { APIRoute } from 'astro';
import { CloudflareService, TenantService } from '@notionglaze/core';

export const POST: APIRoute = async ({ request, locals }) => {
    const tenantId = (locals as any).userId;
    const env = (locals as any).runtime?.env;
    const db = env?.DB;

    if (!tenantId || !db) {
        return new Response(JSON.stringify({ error: 'Unauthorized or DB missing' }), { status: 401 });
    }

    try {
        const body = await request.json() as any;
        const { custom_domain, subdomain } = body;

        // Use pre-resolved tenant from middleware
        const tenant = (locals as any).tenant;
        if (!tenant) {
            return new Response(JSON.stringify({ error: 'Tenant record not found' }), { status: 404 });
        }

        const tenantService = new TenantService(db);

        // Normalize domains
        let cleanSubdomain = (subdomain !== undefined)
            ? (subdomain ? subdomain.toLowerCase().trim() : null)
            : undefined;

        let cleanCustomDomain = (custom_domain !== undefined)
            ? (custom_domain ? custom_domain.toLowerCase().trim() : null)
            : undefined;

        if (cleanCustomDomain) {
            cleanCustomDomain = cleanCustomDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            if (cleanCustomDomain.startsWith('www.')) {
                cleanCustomDomain = cleanCustomDomain.substring(4);
            }
            const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,10}$/;
            if (!domainRegex.test(cleanCustomDomain)) {
                return new Response(JSON.stringify({ error: 'Invalid custom domain format.' }), { status: 400 });
            }
        }

        if (cleanSubdomain) {
            const subdomainRegex = /^[a-z0-9-]+$/;
            if (!subdomainRegex.test(cleanSubdomain)) {
                return new Response(JSON.stringify({ error: 'Invalid subdomain format.' }), { status: 400 });
            }
        }

        // Duplicate Check
        if (cleanSubdomain) {
            const existingSub = await db.prepare("SELECT id FROM tenants WHERE subdomain = ? AND id != ?").bind(cleanSubdomain, tenant.id).first();
            if (existingSub) return new Response(JSON.stringify({ error: 'Subdomain already taken.' }), { status: 400 });
        }
        if (cleanCustomDomain) {
            const existingDomain = await db.prepare("SELECT id FROM tenants WHERE custom_domain = ? AND id != ?").bind(cleanCustomDomain, tenant.id).first();
            if (existingDomain) return new Response(JSON.stringify({ error: 'Custom domain already registered.' }), { status: 400 });
        }

        // Cloudflare Setup
        if (cleanCustomDomain && cleanCustomDomain !== tenant.custom_domain) {
            const cf = new CloudflareService(env);
            await cf.upsertCustomHostname(cleanCustomDomain);
        }

        // Centralized Update via TenantService
        const config = await tenantService.updateTenant(tenant.id, {
            ...body,
            subdomain: cleanSubdomain,
            custom_domain: cleanCustomDomain
        });

        return new Response(JSON.stringify({ success: true, config }), { status: 200 });
    } catch (err: any) {
        console.error('Save Settings Error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
    }
};
