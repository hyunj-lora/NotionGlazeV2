import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB;
    const tenantId = (locals as any).userId;

    if (!tenantId) {
        return new Response('Unauthorized', { status: 401 });
    }

    if (!db) {
        return new Response('Database not found', { status: 500 });
    }

    try {
        const cookies = request.headers.get('cookie');
        const sessionId = cookies?.split(';').find((c: string) => c.trim().startsWith('session_id='))?.split('=')[1];

        // 1. Delete session record if present
        if (sessionId) {
            await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
        }

        // 2. Disconnect Notion for this user's tenant
        await db.prepare(`
            UPDATE tenants 
            SET notion_access_token = NULL, root_page_id = NULL 
            WHERE owner_id = ?
        `).bind(tenantId).run();

        // 3. Clear Cookie
        const responseHeaders = new Headers();
        responseHeaders.append('Set-Cookie', 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');

        return new Response('Disconnected', {
            status: 200,
            headers: responseHeaders
        });
    } catch (e) {
        console.error(e);
        return new Response('Database error', { status: 500 });
    }
}
