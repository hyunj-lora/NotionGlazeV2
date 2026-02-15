import type { APIRoute } from 'astro';
import { DomainService } from '@notionglaze/core';

export const GET: APIRoute = async ({ locals }) => {
    const tenantId = (locals as any).userId;
    const env = (locals as any).runtime?.env;
    const db = env?.DB;

    if (!tenantId || !db) {
        return new Response(JSON.stringify({ error: 'Unauthorized or DB missing' }), { status: 401 });
    }

    try {
        const tenant = (locals as any).tenant;

        if (!tenant || !tenant.custom_domain) {
            return new Response(JSON.stringify({ status: 'no_domain' }), { status: 200 });
        }

        const domainService = new DomainService(env);
        const [status, isHealthy] = await Promise.all([
            domainService.getUnifiedStatus(tenant.custom_domain),
            domainService.probeConnection(tenant.custom_domain)
        ]);

        return new Response(JSON.stringify({
            ...status,
            isHealthy
        }), { status: 200 });
    } catch (err: any) {
        console.error('API.domain-status error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
