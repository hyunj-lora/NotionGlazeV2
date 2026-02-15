import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    const tenantId = (locals as any).userId;
    const bucket = (locals as any).runtime?.env?.BUCKET;

    if (!tenantId || !bucket) {
        return new Response(JSON.stringify({ error: 'Unauthorized or Storage missing' }), { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ error: 'Invalid file type. Only images and icons are allowed.' }), { status: 400 });
        }

        // Generate key: favicon/[tenantId]-[timestamp].[ext]
        const ext = file.name.split('.').pop() || 'png';
        const key = `tenants/${tenantId}/favicon-${Date.now()}.${ext}`;

        await bucket.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        const url = `/api/assets/${key}`;
        return new Response(JSON.stringify({ url }), { status: 200 });

    } catch (err) {
        console.error('Upload Error:', err);
        return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 });
    }
};
