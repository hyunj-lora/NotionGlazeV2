import { Env, SyncContext } from "../index.js";
import { NotionService } from "@notionglaze/core";

export async function processBlocksForAssets(blocks: any[], tenantId: string, pageId: string, env: Env, context: SyncContext, notion: NotionService) {
    for (const block of blocks) {
        // Stop if we are pushing too many subrequests
        if (context.requestCount > 45) break;

        const type = block.type;
        const data = block[type];

        // Helper to hijack and update
        const hijack = async (url: string | undefined) => {
            if (url && (url.includes('amazonaws.com') || data.type === 'file')) {
                return await hijackAsset(url, tenantId, pageId, block.id, env, context);
            }
            return null;
        };

        if (['image', 'video', 'file', 'pdf', 'audio'].includes(type) && data) {
            const rawUrl = data.file?.url || data.external?.url;
            const newUrl = await hijack(rawUrl);

            if (newUrl) {
                // Normalize to 'file' type pointing to our asset
                // This ensures the renderer sees it as a permanent URL
                block[type] = {
                    ...data, // keep caption etc
                    type: 'file',
                    file: { url: newUrl }
                };
            }
        } else if (type === 'child_database' && data.title === 'Untitled') {
            // Fetch real title if missing
            try {
                context.requestCount++;
                const dbInfo = await notion.getDatabase(block.id) as any;
                // dbInfo.title is an array of rich text objects
                const realTitle = dbInfo.title?.map((t: any) => t.plain_text).join('') || 'Untitled';
                data.title = realTitle;
                console.log(`    Refreshed Database Title: ${realTitle}`);
            } catch (e) {
                console.warn(`    Failed to fetch database title for ${block.id}`, e);
            }
        }

        // Process children recursively
        if (block.children) {
            await processBlocksForAssets(block.children, tenantId, pageId, env, context, notion);
        }
    }
}

export async function hijackAsset(url: string, tenantId: string, pageId: string, assetId: string, env: Env, context: SyncContext): Promise<string> {
    console.log(`    Hijacking asset: ${assetId}`);
    context.requestCount++; // Tracking fetch subrequest

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download asset: ${response.statusText}`);

        const blob = await response.blob();
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        // Guess extension
        let extension = 'bin';
        if (contentType.includes('image/')) extension = contentType.split('/')[1];
        else if (contentType === 'application/pdf') extension = 'pdf';
        else if (contentType.includes('video/')) extension = contentType.split('/')[1];

        // Clean extension
        if (extension === 'jpeg') extension = 'jpg';
        if (extension.includes(';')) extension = extension.split(';')[0];


        const key = `${tenantId}/${pageId}/${assetId}.${extension}`;

        await env.BUCKET.put(key, blob, {
            httpMetadata: { contentType: contentType }
        });

        return `/api/assets/${key}`;
    } catch (e) {
        console.error(`      Failed to hijack asset ${assetId}:`, e);
        return url; // Fallback to original if fail
    }
}

export async function processPageAssets(page: any, tenantId: string, env: Env, context: SyncContext) {
    let coverUrl = null;
    let iconUrl = null;

    // 1. Cover
    if (page.cover) {
        const rawUrl = page.cover.file?.url || page.cover.external?.url;
        if (rawUrl) {
            if (rawUrl.includes('amazonaws.com') || page.cover.type === 'file') {
                coverUrl = await hijackAsset(rawUrl, tenantId, page.id, 'cover', env, context);
            } else {
                coverUrl = rawUrl; // Keep external if not expiring (unlikely for covers, but safe)
            }
        }
    }

    // 2. Icon (if file type)
    if (page.icon && page.icon.type === 'file') {
        const rawUrl = page.icon.file.url;
        if (rawUrl) {
            iconUrl = await hijackAsset(rawUrl, tenantId, page.id, 'icon', env, context);
        }
    }

    return { coverUrl, iconUrl };
}
