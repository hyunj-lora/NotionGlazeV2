import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals }) => {
    const tenantId = (locals as any).userId;
    const syncWorker = (locals as any).runtime?.env?.SYNC_WORKER;

    if (!tenantId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // --- Subscription Gating ---
    const db = (locals as any).runtime?.env?.DB;
    let tenantIdForSync = tenantId;

    if (db) {
        const tenant = await db.prepare('SELECT id, plan, trial_ends_at FROM tenants WHERE owner_id = ?').bind(tenantId).first();
        const now = Math.floor(Date.now() / 1000);

        if (!tenant) {
            return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
        }

        tenantIdForSync = tenant.id; // Use Notion ID for sync worker

        if (tenant?.plan === 'pro') {
            // All good
        } else if (tenant?.plan === 'trial' && tenant.trial_ends_at > now) {
            // Still in trial, allow sync
        } else {
            return new Response(JSON.stringify({
                error: 'Trial expired or subscription required. Upgrade to Pro to continue syncing.'
            }), { status: 403 });
        }
    }

    try {
        // ... (rest of the logic)
        let response;
        if (syncWorker) {
            response = await syncWorker.fetch(`http://internal/sync?tenantId=${tenantIdForSync}`);
        } else {
            // Local dev fallback: try to call local worker if available
            response = await fetch(`http://localhost:8790/sync?tenantId=${tenantIdForSync}`);
        }

        if (response.ok) {
            return new Response(JSON.stringify({ success: true, message: 'Sync triggered' }));
        } else {
            const error = await response.text();
            return new Response(JSON.stringify({ error: `Worker error: ${error}` }), { status: 500 });
        }
    } catch (err) {
        console.error('Sync Trigger Error:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
