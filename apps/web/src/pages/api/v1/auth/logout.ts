import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB;

    try {
        const cookies = request.headers.get('cookie');
        const sessionId = cookies?.split(';').find((c: string) => c.trim().startsWith('session_id='))?.split('=')[1];

        // 1. Delete session record if present
        if (sessionId && db) {
            await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
        }

        // 2. Clear Cookie
        const responseHeaders = new Headers();
        responseHeaders.append('Set-Cookie', 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: responseHeaders
        });
    } catch (e) {
        console.error('Logout error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
