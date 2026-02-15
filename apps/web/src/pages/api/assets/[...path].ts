import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals, request }) => {
    const path = params.path;

    if (!path) {
        return new Response('Not Found', { status: 404 });
    }

    try {
        const bucket = (locals as any).runtime?.env?.BUCKET;

        if (!bucket) {
            throw new Error('R2 Bucket binding not found');
        }

        // Use ONLY head request if we want to check etag first? 
        // No, R2 get is fine.
        const object = await bucket.get(path);

        if (!object) {
            return new Response('Asset not found', { status: 404 });
        }

        const headers = new Headers();

        if (object.httpEtag) {
            headers.set('etag', object.httpEtag);
        }

        // 304 Not Modified Support
        const ifNoneMatch = request.headers.get('If-None-Match');
        if (ifNoneMatch && object.httpEtag === ifNoneMatch) {
            return new Response(null, { status: 304, headers });
        }

        // Manually set headers to avoid Miniflare/Astro serialization issues
        if (object.httpMetadata?.contentType) {
            headers.set('Content-Type', object.httpMetadata.contentType);
        } else {
            // Fallback content type based on extension
            const ext = path.split('.').pop()?.toLowerCase();
            const mime: Record<string, string> = {
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
                'webp': 'image/webp'
            };
            headers.set('Content-Type', mime[ext || ''] || 'application/octet-stream');
        }

        if (object.httpEtag) {
            headers.set('etag', object.httpEtag);
        }

        headers.set('Cache-Control', 'public, max-age=31536000');

        return new Response(object.body, {
            headers,
        });
    } catch (error) {
        console.error('Error serving asset:', error);
        return new Response('Error serving asset', { status: 500 });
    }
};
