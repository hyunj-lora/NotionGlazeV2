import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const GET: APIRoute = async ({ url, locals }) => {
    const { userId } = locals;
    const txId = url.searchParams.get('txId');

    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!txId) {
        return new Response(JSON.stringify({ error: 'Missing txId' }), { status: 400 });
    }

    try {
        const redis = new Redis({
            url: import.meta.env.UPSTASH_REDIS_REST_URL || '',
            token: import.meta.env.UPSTASH_REDIS_REST_TOKEN || '',
        });

        // Check if the worker has pushed the result to completion-queue
        const result: any = await redis.get(`completion-queue:${txId}`);

        if (result) {
            // Cleanup: Optional, or use EXPIRE on the key
            return new Response(JSON.stringify({
                status: 'completed',
                idMap: result.idMap
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ status: 'pending' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Poll Status API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
