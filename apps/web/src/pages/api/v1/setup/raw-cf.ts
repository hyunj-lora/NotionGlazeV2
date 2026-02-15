import type { APIRoute } from 'astro';
import { CloudflareService } from '@notionglaze/core';

export const GET: APIRoute = async ({ locals }) => {
    const env = (locals as any).runtime?.env;
    const db = env?.DB;

    try {
        const tenant = (locals as any).tenant;
        if (!tenant || !tenant.custom_domain) {
            return new Response(JSON.stringify({ error: 'No domain' }), { status: 400 });
        }

        const cf = new CloudflareService(env);
        const res = await (cf as any).request(`/custom_hostnames?hostname=${tenant.custom_domain}`);

        return new Response(JSON.stringify(res, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
