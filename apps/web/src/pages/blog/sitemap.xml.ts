import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, url }) => {
    const { blogTenantId: tenantId } = locals as any;
    const db = (locals as any).runtime?.env?.DB;

    if (!db) {
        return new Response('Database not found', { status: 500 });
    }

    const { results: posts } = await db.prepare(
        "SELECT slug, last_edited_time FROM posts WHERE tenant_id = ? ORDER BY last_edited_time DESC"
    ).bind(tenantId).all();

    const baseUrl = url.origin;

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
        <lastmod>${new Date(post.last_edited_time).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`).join('')}
</urlset>`.trim();

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600'
        }
    });
};
