import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const { content, email } = body;

        // Use the Cloudflare D1 binding (provided via locals in Astro Cloudflare adapter)
        // Check if DB is available (development vs production)
        const db = (locals as any).runtime?.env?.DB;

        if (!db) {
            throw new Error('D1 Database binding not found');
        }

        await db.prepare('INSERT INTO pain_points (content, email) VALUES (?, ?)')
            .bind(content, email)
            .run();

        return new Response(JSON.stringify({
            message: 'Success'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error saving pain point:', error);
        return new Response(JSON.stringify({
            message: 'Failed to save pulse',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
