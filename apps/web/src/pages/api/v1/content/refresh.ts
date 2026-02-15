import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals }) => {
    const runtime = (locals as any).runtime;
    const tenantId = (locals as any).userId;
    const workerUrl = runtime?.env?.SYNC_WORKER_URL || 'http://localhost:8787';

    if (!tenantId) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const response = await fetch(`${workerUrl}/sync?tenantId=${tenantId}`, {
            method: 'GET', // Worker expects GET for trigger
        });

        if (response.ok) {
            return new Response('Sync triggered', { status: 200 });
        } else {
            return new Response('Failed to trigger sync', { status: 502 });
        }
    } catch (e) {
        console.error(e);
        return new Response('Internal Server Error', { status: 500 });
    }
}
