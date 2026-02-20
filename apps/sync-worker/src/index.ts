export interface SyncContext {
    requestCount: number;
}

export interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    AI: any;
    NOTION_CLIENT_ID: string;
    NOTION_CLIENT_SECRET: string;
    ENCRYPTION_SECRET: string;
    SYNC_WORKER: { fetch: typeof fetch };
}
import { syncTenant, processChunk } from "./core/sync.js";
import { provideAISidekick } from "./core/ai.js";
import { hijackAsset, processPageAssets, processBlocksForAssets } from "./core/assets.js";

const val = (v: any) => (v === undefined ? null : v);

export default {
    async scheduled(event: any, env: Env, ctx: any): Promise<void> {
        console.log('--- Starting Sync Heist 2.0 (Parallel) ---');

        try {
            const now = Math.floor(Date.now() / 1000);
            const { results: tenants } = await env.DB.prepare(`
                SELECT * FROM tenants 
                WHERE plan = 'pro' 
                OR (plan = 'trial' AND trial_ends_at > ?)
            `).bind(now).all();

            console.log(`Found ${tenants.length} eligible tenants for sync.`);

            for (const tenant of tenants as any) {
                ctx.waitUntil(syncTenant(tenant, env));
            }
        } catch (err) {
            console.error('Scheduled Sync Dispatch failed:', err);
        }
    },

    async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname.endsWith('/sync-chunk')) {
            const body: any = await request.json();
            ctx.waitUntil(processChunk(body.tenantId, body.pages, env, body.isLastChunk));
            return new Response('Chunk processing started');
        }

        if (url.pathname.endsWith('/sync')) {
            const tenantId = url.searchParams.get('tenantId');
            if (tenantId) {
                const tenant = await env.DB.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first();
                if (!tenant) {
                    return new Response(`Tenant ${tenantId} not found`, { status: 404 });
                }

                const now = Math.floor(Date.now() / 1000);
                const t = tenant as any;
                if (t.plan !== 'pro' && (!t.trial_ends_at || now > t.trial_ends_at)) {
                    return new Response(`Sync blocked: Trial expired or no active subscription.`, { status: 403 });
                }

                ctx.waitUntil(syncTenant(tenant, env));
                return new Response(`Sync triggered for tenant ${tenantId}`);
            } else {
                ctx.waitUntil(this.scheduled({} as any, env, ctx));
                return new Response('Sync triggered for all tenants.');
            }
        }

        if (url.pathname.endsWith('/debug-db')) {
            const { results: users } = await env.DB.prepare('SELECT count(*) as c FROM users').all();
            const { results: tenants } = await env.DB.prepare('SELECT * FROM tenants').all();
            return new Response(JSON.stringify({ users, tenants }, null, 2), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response('Sync Worker is active.');
    }
};
