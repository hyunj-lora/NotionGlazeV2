export const prerender = false;

export async function POST({ request, locals }: any) {
    const runtime = locals.runtime;
    const db = runtime?.env?.DB;
    const ADMIN_TOKEN = "notionglaze-master-key";

    // 1. Auth Check
    const authHeader = request.headers.get('Authorization');
    const cookieToken = (request.headers.get('cookie') || '').split(';').find((c: string) => c.trim().startsWith('admin_session='))?.split('=')[1];

    if (authHeader !== `Bearer ${ADMIN_TOKEN}` && cookieToken !== ADMIN_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { action, tenantId, value } = await request.json();

    if (!db) {
        return new Response(JSON.stringify({ error: 'DB missing' }), { status: 500 });
    }

    try {
        // Global Actions (No tenantId required)
        if (action === 'global-sync') {
            await db.prepare("UPDATE tenants SET sync_status = 'syncing', last_synced_at = 0 WHERE plan = 'pro'").run();
            return new Response(JSON.stringify({ success: true }));
        }

        if (action === 'clear-errors') {
            await db.prepare("UPDATE tenants SET sync_status = 'idle', last_sync_error = NULL WHERE sync_status IN ('error', 'failed')").run();
            return new Response(JSON.stringify({ success: true }));
        }

        // Tenant-specific Actions
        if (!tenantId) {
            return new Response(JSON.stringify({ error: 'Tenant ID required' }), { status: 400 });
        }

        if (action === 'update-plan') {
            await db.prepare('UPDATE tenants SET plan = ? WHERE id = ?')
                .bind(value, tenantId)
                .run();
            return new Response(JSON.stringify({ success: true }));
        }

        if (action === 'force-sync') {
            // Set status to 'syncing' and clear the last_synced_at to trigger the worker
            await db.prepare("UPDATE tenants SET sync_status = 'syncing', last_synced_at = 0 WHERE id = ?")
                .bind(tenantId)
                .run();
            return new Response(JSON.stringify({ success: true }));
        }

        if (action === 'delete-tenant') {
            // Cleanup tenant and their posts
            await db.batch([
                db.prepare('DELETE FROM tenants WHERE id = ?').bind(tenantId),
                db.prepare('DELETE FROM posts WHERE tenant_id = ?').bind(tenantId),
                db.prepare('DELETE FROM tenant_sources WHERE tenant_id = ?').bind(tenantId)
            ]);
            return new Response(JSON.stringify({ success: true }));
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
