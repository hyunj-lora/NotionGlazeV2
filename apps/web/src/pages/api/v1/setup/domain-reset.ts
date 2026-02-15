import type { APIRoute } from 'astro';
import { DomainService } from '@notionglaze/core';

export const POST: APIRoute = async ({ locals }) => {
    const tenantId = (locals as any).userId;
    const env = (locals as any).runtime?.env;
    const db = env?.DB;

    if (!tenantId || !db) {
        return new Response(JSON.stringify({ error: 'Unauthorized or DB missing' }), { status: 401 });
    }

    try {
        const tenant = (locals as any).tenant;

        if (!tenant || !tenant.custom_domain) {
            return new Response(JSON.stringify({ error: 'No custom domain configured' }), { status: 400 });
        }

        const domainService = new DomainService(env);
        console.log(`Hard-resetting domain connection for: ${tenant.custom_domain}`);
        const result = await domainService.resetDomain(tenant.custom_domain);

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error('API.domain-reset error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
