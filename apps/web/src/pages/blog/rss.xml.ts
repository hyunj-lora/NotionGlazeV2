import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, site }) => {
    const { blogTenantId: tenantId } = locals as any;
    const db = (locals as any).runtime?.env?.DB;

    if (!db) {
        return new Response('Database not found', { status: 500 });
    }

    const { results: posts } = await db.prepare(
        "SELECT * FROM posts WHERE tenant_id = ? ORDER BY published_at DESC LIMIT 20"
    ).bind(tenantId).all();

    const tenant = await db.prepare("SELECT config_json FROM tenants WHERE id = ?").bind(tenantId).first();
    const config = JSON.parse(tenant?.config_json || '{}');
    const siteName = config.site_name || 'NotionGlaze Blog';
    const siteDescription = config.site_description || 'A blog powered by NotionGlaze';

    return rss({
        title: siteName,
        description: siteDescription,
        site: site?.toString() || 'https://notionglaze.cc',
        items: posts.map((post: any) => ({
            title: post.title,
            pubDate: new Date(post.published_at),
            description: post.summary,
            link: `/blog/${post.slug}`,
        })),
        customData: `<language>en-us</language>`,
    });
};
