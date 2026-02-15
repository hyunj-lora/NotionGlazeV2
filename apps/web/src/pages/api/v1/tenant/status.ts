import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
    const tenantId = (locals as any).userId;
    const db = (locals as any).runtime?.env?.DB;

    if (!tenantId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database binding missing' }), { status: 500 });
    }

    try {
        const tenant = await db.prepare('SELECT sync_status, sync_progress, last_sync_error, last_sync_count FROM tenants WHERE owner_id = ?')
            .bind(tenantId)
            .first();

        if (!tenant) {
            return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
        }

        return new Response(JSON.stringify(tenant));
    } catch (err) {
        console.error('Error fetching tenant status:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
