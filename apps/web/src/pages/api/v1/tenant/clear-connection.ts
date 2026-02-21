import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals }) => {
    const userId = (locals as any).userId;
    const db = (locals as any).runtime?.env?.DB;

    if (!userId || !db) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        await db
            .prepare("UPDATE tenants SET connection_type = 'public_link', public_link_url = NULL, root_page_id = NULL, sync_status = 'pending' WHERE owner_id = ?")
            .bind(userId)
            .run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to clear connection' }), { status: 500 });
    }
};
