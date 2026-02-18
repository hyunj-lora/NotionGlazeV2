import type { APIRoute } from 'astro';
import { AuthService } from '@notionglaze/core';

export const POST: APIRoute = async ({ request, locals }) => {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB;

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }

    try {
        const cookies = request.headers.get('cookie');
        const sessionId = cookies?.split(';').find((c: string) => c.trim().startsWith('session_id='))?.split('=')[1] || null;

        const authService = new AuthService(db);
        const { cookies: clearingCookies } = await authService.logout(sessionId);

        const responseHeaders = new Headers();
        clearingCookies.forEach(cookie => {
            responseHeaders.append('Set-Cookie', `${cookie.name}=${cookie.value}; ${cookie.attributes}`);
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: responseHeaders
        });
    } catch (e) {
        console.error('Logout error:', e);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
