import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
    const tenantId = (locals as any).userId;
    const db = (locals as any).runtime?.env?.DB;

    if (!tenantId || !db) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const tId = (locals as any).tenantId;
        if (!tId) return new Response(JSON.stringify({ error: 'Tenant context missing' }), { status: 400 });

        const { results } = await db.prepare('SELECT * FROM tenant_sources WHERE tenant_id = ?').bind(tId).all();
        return new Response(JSON.stringify(results), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    const tenantId = (locals as any).userId;
    const db = (locals as any).runtime?.env?.DB;

    if (!tenantId || !db) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, name, notion_db_id, auto_tag } = body;

        if (!name || !notion_db_id) {
            return new Response(JSON.stringify({ error: 'Name and Database ID are required' }), { status: 400 });
        }

        const sourceId = id || crypto.randomUUID();

        const tId = (locals as any).tenantId;
        if (!tId) return new Response(JSON.stringify({ error: 'Tenant context missing' }), { status: 400 });

        await db.prepare(`
            INSERT INTO tenant_sources (id, tenant_id, name, notion_db_id, auto_tag)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                notion_db_id = excluded.notion_db_id,
                auto_tag = excluded.auto_tag
        `).bind(sourceId, tId, name, notion_db_id, auto_tag || null).run();

        return new Response(JSON.stringify({ success: true, id: sourceId }), { status: 200 });
    } catch (err) {
        console.error('Sources save error:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
    const tenantId = (locals as any).userId;
    const db = (locals as any).runtime?.env?.DB;

    if (!tenantId || !db) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        const tId = (locals as any).tenantId;
        if (!tId) return new Response(JSON.stringify({ error: 'Tenant context missing' }), { status: 400 });

        await db.prepare('DELETE FROM tenant_sources WHERE id = ? AND tenant_id = ?').bind(id, tId).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
