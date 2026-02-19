import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
    const tenantId = (context.locals as any).blogTenantId;
    const db = (context.locals as any).runtime?.env?.DB;

    if (!tenantId || !db) {
        return new Response('Not Found', { status: 404 });
    }

    const { results: posts } = await db.prepare(
        'SELECT * FROM posts WHERE tenant_id = ? AND status = "Published" ORDER BY published_at DESC LIMIT 50'
    ).bind(tenantId).all();

    const tenant = await db.prepare(
        'SELECT config_json FROM tenants WHERE id = ?'
    ).bind(tenantId).first();

    const config = JSON.parse(tenant?.config_json || '{}');
    const siteTitle = config.site_name || '';
    const siteDescription = config.site_description || '';

    return rss({
        title: siteTitle,
        description: siteDescription,
        site: context.url.origin,
        items: posts.map((post: any) => ({
            title: post.title,
            pubDate: new Date(post.published_at || post.created_time),
            description: post.summary || '',
            link: `/blog/${post.slug}`,
        })),
        customData: `<language>en-us</language>`,
    });
};
