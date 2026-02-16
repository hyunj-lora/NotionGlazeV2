import type { APIRoute } from 'astro';
import { CryptoService } from "@notionglaze/core";

export const GET: APIRoute = async ({ locals }) => {
    const tenantId = (locals as any).userId;
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB;
    const encryptionSecret = runtime?.env?.ENCRYPTION_SECRET;

    if (!tenantId || !db) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const tenant = (locals as any).tenant;

        if (!tenant || !tenant.notion_access_token || !tenant.root_page_id) {
            return new Response(JSON.stringify({ error: 'Tenant connection not fully established' }), { status: 400 });
        }

        // Decrypt token
        const cryptoService = new CryptoService(encryptionSecret);
        const accessToken = await cryptoService.decrypt(tenant.notion_access_token);

        // Fetch Database or Page info from Notion
        // We try both database and page endpoints since it could be either
        let iconUrl = null;

        try {
            const dbRes = await fetch(`https://api.notion.com/v1/databases/${tenant.root_page_id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Notion-Version': '2022-06-28'
                }
            });
            const dbData = await dbRes.json() as any;

            if (dbRes.ok && dbData.icon) {
                iconUrl = dbData.icon.emoji || dbData.icon.external?.url || dbData.icon.file?.url;
            } else {
                // Try as Page if Database fails
                const pgRes = await fetch(`https://api.notion.com/v1/pages/${tenant.root_page_id}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Notion-Version': '2022-06-28'
                    }
                });
                const pgData = await pgRes.json() as any;
                if (pgRes.ok && pgData.icon) {
                    iconUrl = pgData.icon.emoji || pgData.icon.external?.url || pgData.icon.file?.url;
                }
            }
        } catch (e) {
            console.error('Notion API error:', e);
        }

        return new Response(JSON.stringify({ icon: iconUrl }), { status: 200 });
    } catch (err) {
        console.error('Notion Meta Sync Error:', err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
