import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
    const { id } = params;
    const db = (locals as any).runtime?.env?.DB;

    if (!id || !db) {
        return new Response('Missing ID or DB', { status: 400 });
    }

    try {
        const post = await db.prepare('SELECT title, summary, tags, tenant_id FROM posts WHERE id = ?').bind(id).first();
        if (!post) return new Response('Post not found', { status: 404 });

        const tenant = await db.prepare('SELECT config_json FROM tenants WHERE id = ?').bind(post.tenant_id).first();
        const config = JSON.parse(tenant?.config_json || '{}');
        const brandColor = config.brand_color || '#6366f1';
        const siteName = config.site_name || 'NotionGlaze Blog';

        // Load Font (Pretendard Bold for wide character support including Korean)
        const fontData = await fetch('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf').then(res => res.arrayBuffer());

        const svg = await satori(
            {
                type: 'div',
                props: {
                    style: {
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundColor: '#09090b',
                        backgroundImage: `radial-gradient(circle at 0% 0%, ${brandColor}33 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${brandColor}22 0%, transparent 50%)`,
                        padding: '80px',
                        color: 'white',
                        fontFamily: 'Pretendard',
                    },
                    children: [
                        {
                            type: 'div',
                            props: {
                                style: {
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: brandColor,
                                    marginBottom: '20px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                },
                                children: siteName,
                            }
                        },
                        {
                            type: 'div',
                            props: {
                                style: {
                                    fontSize: '72px',
                                    fontWeight: 800,
                                    lineHeight: 1.1,
                                    marginBottom: '30px',
                                },
                                children: post.title,
                            }
                        },
                        {
                            type: 'div',
                            props: {
                                style: {
                                    fontSize: '32px',
                                    color: '#a1a1aa',
                                    lineHeight: 1.4,
                                    maxWidth: '800px',
                                },
                                children: post.summary || '',
                            }
                        }
                    ],
                }
            },
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'Pretendard',
                        data: fontData,
                        weight: 700,
                        style: 'normal',
                    },
                ],
            }
        );

        const resvg = new Resvg(svg);
        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        return new Response(new Uint8Array(pngBuffer), {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (err) {
        console.error('OG Generation Error:', err);
        return new Response('Error generating image', { status: 500 });
    }
};
