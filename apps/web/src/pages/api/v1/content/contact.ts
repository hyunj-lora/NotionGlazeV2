import type { APIRoute } from 'astro';
import { NotionService, CryptoService } from "@notionglaze/core";

export const POST: APIRoute = async ({ request, locals }) => {
    const db = (locals as any).runtime?.env?.DB;
    const encryptionSecret = (locals as any).runtime?.env?.ENCRYPTION_SECRET;
    const blogTenantId = (locals as any).blogTenantId; // ID of the site being visited

    if (!db || !blogTenantId) {
        return new Response(JSON.stringify({ error: 'System Error' }), { status: 500 });
    }

    try {
        const body = await request.json();
        const { name, email, message } = body;

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
        }

        const tenant = await db.prepare('SELECT notion_access_token, config_json FROM tenants WHERE id = ?').bind(blogTenantId).first();
        if (!tenant) return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });

        const config = JSON.parse(tenant.config_json || '{}');
        const contactDbId = config.contact_database_id;

        if (!contactDbId) {
            return new Response(JSON.stringify({ error: 'Contact form not configured' }), { status: 400 });
        }

        const cryptoService = new CryptoService(encryptionSecret);
        const decryptedToken = await cryptoService.decrypt(tenant.notion_access_token);
        const notion = new NotionService(decryptedToken);

        // Send to Notion
        // Create a new page in the contact database
        await notion.client.pages.create({
            parent: { database_id: contactDbId },
            properties: {
                Name: {
                    title: [{ text: { content: `Lead: ${name}` } }]
                },
                Email: {
                    email: email
                },
                Message: {
                    rich_text: [{ text: { content: message } }]
                }
            }
        } as any);

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (err: any) {
        console.error('Contact Form Error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
