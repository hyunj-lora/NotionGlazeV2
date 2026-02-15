import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const POST: APIRoute = async ({ request, locals }) => {
    const { tenant, userId } = locals;

    if (!userId || !tenant) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const { sourceId, targetParentId, txId } = await request.json() as {
            sourceId: string;
            targetParentId: string;
            txId: string;
        };

        if (!sourceId || !targetParentId || !txId) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
        }

        // Initialize Upstash Redis (Compatible with Cloudflare)
        // These env vars should be set in Cloudflare Dashboard
        const redis = new Redis({
            url: import.meta.env.UPSTASH_REDIS_REST_URL || '',
            token: import.meta.env.UPSTASH_REDIS_REST_TOKEN || '',
        });

        // Enqueue the job for the Remapping Worker
        // We use a simple list-based queue or a specific 'jobs' hash
        await redis.lpush('notion-remapping-queue', JSON.stringify({
            sourceId,
            targetParentId,
            txId,
            accessToken: tenant.notion_access_token,
            tenantId: tenant.id,
            timestamp: Date.now()
        }));

        return new Response(JSON.stringify({
            success: true,
            message: 'Move job enqueued',
            txId
        }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Block Move API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
