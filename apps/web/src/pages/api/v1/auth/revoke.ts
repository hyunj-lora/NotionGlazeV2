import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB;
    const userId = (locals as any).userId; // Internal UUID (same as sessions.user_id)

    if (!db) {
        return new Response('Database not found', { status: 500 });
    }

    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // 1. Delete ALL sessions for this user (not just current device)
        await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();

        // 2. Disconnect Notion for this user's tenant
        await db.prepare(`
            UPDATE tenants 
            SET notion_access_token = NULL, root_page_id = NULL 
            WHERE owner_id = ?
        `).bind(userId).run();

        // 3. Clear Cookies (session_id + notion_glaze_id to prevent Silent Login)
        const responseHeaders = new Headers();
        responseHeaders.append('Set-Cookie', 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');
        responseHeaders.append('Set-Cookie', 'notion_glaze_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');

        return new Response('Disconnected', {
            status: 200,
            headers: responseHeaders
        });
    } catch (e) {
        console.error(e);
        return new Response('Database error', { status: 500 });
    }
}
