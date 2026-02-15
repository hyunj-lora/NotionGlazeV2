import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
    const tenantId = (context.locals as any).blogTenantId;
    const db = (context.locals as any).runtime?.env?.DB;

    if (!tenantId || !db) {
        return new Response('Not Found', { status: 404 });
    }

    const { results: posts } = await db.prepare(
        'SELECT slug, last_edited_time FROM posts WHERE tenant_id = ? AND status = "Published" ORDER BY last_edited_time DESC'
    ).bind(tenantId).all();

    const baseUrl = context.url.origin;

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${posts.map((post: any) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.last_edited_time).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
};
