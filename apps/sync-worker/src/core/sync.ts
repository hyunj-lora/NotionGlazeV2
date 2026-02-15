import { Env, SyncContext } from "../index.js";
import { NotionService, NotionParser, CryptoService, TenantService, PostService } from "@notionglaze/core";
import { processBlocksForAssets, processPageAssets } from "./assets.js";
import { provideAISidekick } from "./ai.js";

const val = (v: any) => (v === undefined ? null : v);

interface MappedProperties {
    title: string;
    slug: string;
    status: string;
    summary: string | null;
    tags: string[];
    publishedAt: number | null;
    seoTitle: string;
    seoDescription: string | null;
    canonicalUrl: string | null;
    noindex: boolean;
}

function mapNotionProperties(props: any, pageId: string, autoTag?: string): MappedProperties {
    const titlePropKey = Object.keys(props).find(key => props[key].type === 'title');
    const title = titlePropKey ? (props[titlePropKey].title?.[0]?.plain_text || 'Untitled') : 'Untitled';

    const slugPropKey = Object.keys(props).find(key =>
        ['Slug', 'slug', '슬러그', 'URL', 'url'].includes(key)
    );
    const slug = slugPropKey ? (props[slugPropKey].rich_text?.[0]?.plain_text || pageId) : pageId;

    const statusPropKey = Object.keys(props).find(key =>
        ['Status', 'status', '상태'].includes(key)
    );
    const status = statusPropKey ? (props[statusPropKey].status?.name || props[statusPropKey].select?.name || 'Published') : 'Published';

    const summaryPropKey = Object.keys(props).find(key =>
        ['Summary', 'summary', '요약', 'Description', '설명'].includes(key)
    );
    const summary = summaryPropKey ? (props[summaryPropKey].rich_text?.[0]?.plain_text || null) : null;

    const tagsPropKey = Object.keys(props).find(key =>
        ['Tags', 'tags', '태그'].includes(key)
    );
    const tags = tagsPropKey ? (props[tagsPropKey].multi_select?.map((t: any) => t.name) || []) : [];

    if (autoTag && !tags.includes(autoTag)) {
        tags.push(autoTag);
    }

    const datePropKey = Object.keys(props).find(key =>
        ['Date', 'date', '날짜', 'PublishedAt'].includes(key)
    );
    const publishedAt = datePropKey && props[datePropKey].date?.start ? new Date(props[datePropKey].date.start).getTime() : null;

    const seoTitle = props['SEO Title']?.rich_text?.[0]?.plain_text || title;
    const seoDescription = props['SEO Description']?.rich_text?.[0]?.plain_text || summary;

    const canonicalUrlPropKey = Object.keys(props).find(key =>
        ['Canonical', '표준 URL', 'Original URL'].some(k => key.toLowerCase().includes(k.toLowerCase()))
    );
    const canonicalUrl = canonicalUrlPropKey ? (
        props[canonicalUrlPropKey].url ||
        props[canonicalUrlPropKey].rich_text?.[0]?.plain_text ||
        null
    ) : null;

    const noindexPropKey = Object.keys(props).find(key =>
        ['Noindex', '검색 제외', 'Robot Block'].some(k => key.toLowerCase().includes(k.toLowerCase()))
    );
    const noindex = noindexPropKey ? !!props[noindexPropKey].checkbox : false;

    return {
        title, slug, status, summary, tags, publishedAt,
        seoTitle, seoDescription, canonicalUrl, noindex
    };
}

async function runAISEOAnalysis(params: {
    tenant: any,
    env: Env,
    title: string,
    parsedBlocks: any[],
    summary: string | null,
    seoDescription: string | null,
    tags: string[],
    pageId: string
}): Promise<{
    summary: string | null,
    seoDescription: string | null,
    tags: string[],
    aiSeoStatus: 'completed' | 'skipped' | 'failed',
    aiSeoAdvice: string | null
}> {
    const { tenant, env, title, parsedBlocks, pageId } = params;
    let { summary, seoDescription, tags } = params;
    const config = tenant.config || {};

    if (tenant.plan !== 'pro') {
        return { summary, seoDescription, tags, aiSeoStatus: 'skipped', aiSeoAdvice: null };
    }

    const needsAI = (config.ai_seo_enabled && (!seoDescription || seoDescription.length < 10)) ||
        (config.ai_tagging_enabled && tags.length === 0);

    if (!needsAI) {
        return { summary, seoDescription, tags, aiSeoStatus: 'skipped', aiSeoAdvice: null };
    }

    console.log(`    [AI Sidekick] Analyzing page content for ${pageId}...`);
    try {
        const aiResult = await provideAISidekick(title, parsedBlocks, env);
        if (aiResult) {
            if (config.ai_seo_enabled) {
                if (!summary) summary = aiResult.summary;
                if (!seoDescription || seoDescription.length < 10) seoDescription = aiResult.seoDescription;
            }

            if (config.ai_tagging_enabled && aiResult.tags && Array.isArray(aiResult.tags)) {
                for (const t of aiResult.tags) {
                    if (!tags.includes(t)) tags.push(t);
                }
            }
            return { summary, seoDescription, tags, aiSeoStatus: 'completed', aiSeoAdvice: aiResult.seoAdvice || null };
        }
        return { summary, seoDescription, tags, aiSeoStatus: 'skipped', aiSeoAdvice: null };
    } catch (aiErr) {
        console.warn(`    [AI Sidekick] Failed for ${pageId}:`, aiErr);
        return { summary, seoDescription, tags, aiSeoStatus: 'failed', aiSeoAdvice: null };
    }
}

export async function syncTenant(tenant: any, env: Env) {
    console.log(`Processing Tenant: ${tenant.id}`);
    const tenantService = new TenantService(env.DB);
    const encryptionSecret = env.ENCRYPTION_SECRET || 'fallback-secret-for-dev-only';
    const cryptoService = new CryptoService(encryptionSecret);

    await tenantService.startSync(tenant.id);

    try {
        const decryptedToken = await cryptoService.decrypt(tenant.notion_access_token);
        const notion = new NotionService(decryptedToken);

        // 1. Fetch all sources for this tenant
        let sources = await tenantService.getSources(tenant.id);

        // Backward compatibility: If no sources table entries, use the legacy root_page_id
        if (sources.length === 0 && tenant.root_page_id) {
            sources = [{
                id: 'legacy-root',
                notion_db_id: tenant.root_page_id,
                name: 'Main',
                auto_tag: null
            }];
        }

        if (sources.length === 0) {
            throw new Error('No content sources found. Connect a database in settings.');
        }

        const postService = new PostService(env.DB);
        const allUpdatedPages: any[] = [];

        for (const source of sources as any) {
            console.log(`  Checking Source: ${source.name} (${source.notion_db_id})`);

            // --- ACCURATE CHANGE DETECTION (Per Source) ---
            const ourLatestMs = await postService.getLatestPostTime(tenant.id, source.id);

            const notionLatestStr = await notion.getLatestDatabaseChangeTime(source.notion_db_id);

            if (notionLatestStr) {
                const notionLatestMs = new Date(notionLatestStr).getTime();
                if (notionLatestMs <= ourLatestMs) {
                    console.log(`    [Optimization] No changes for source ${source.name}.`);
                    continue;
                }
            }

            const lastSyncDate = ourLatestMs > 0 ? new Date(ourLatestMs) : undefined;
            const response = await notion.getUpdatedPages(source.notion_db_id, lastSyncDate);

            // Add source info to each page
            for (const page of response.results) {
                (page as any)._sourceContext = {
                    sourceId: source.id,
                    autoTag: source.auto_tag
                };
                allUpdatedPages.push(page);
            }
        }

        console.log(`  Found ${allUpdatedPages.length} total updated pages across ${sources.length} sources.`);

        if (allUpdatedPages.length === 0) {
            await tenantService.updateSyncStatus(tenant.id, 'idle');
            return;
        }

        // Update Total Count
        await tenantService.updateSyncMetadata(tenant.id, allUpdatedPages.length);

        // Divide into chunks
        const chunkSize = 5;
        const chunks: any[][] = [];
        for (let i = 0; i < allUpdatedPages.length; i += chunkSize) {
            chunks.push(allUpdatedPages.slice(i, i + chunkSize));
        }

        const chunkPromises = chunks.map((chunk, index) => {
            if (env.SYNC_WORKER) {
                return env.SYNC_WORKER.fetch('http://internal/sync-chunk', {
                    method: 'POST',
                    body: JSON.stringify({
                        tenantId: tenant.id,
                        pages: chunk,
                        isLastChunk: index === chunks.length - 1
                    })
                });
            } else {
                // Fallback for environments without worker-to-worker fetch
                // This might not work perfectly but provides a fallback
                return processChunk(tenant.id, chunk, env, index === chunks.length - 1);
            }
        });

        await Promise.all(chunkPromises);
        console.log(`Sync Lead complete for ${tenant.id}.`);
    } catch (err: any) {
        console.error(`Failed to sync tenant ${tenant.id}:`, err);
        const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
        await env.DB.prepare('UPDATE tenants SET sync_status = ?, last_sync_error = ?, sync_heartbeat = ? WHERE id = ?')
            .bind('error', val(errorMsg), val(Date.now()), val(tenant.id))
            .run();
    }
}

export async function processChunk(tenantId: string, pages: any[], env: Env, isLastChunk: boolean) {
    console.log(`  Chunk Worker: Processing ${pages.length} pages for ${tenantId}`);
    const context = { requestCount: 0 };
    const tenantService = new TenantService(env.DB);

    try {
        const tenant = await tenantService.getTenantById(tenantId) as any;
        if (tenant && tenant.config_json) {
            try {
                tenant.config = JSON.parse(tenant.config_json);
            } catch (e) {
                tenant.config = {};
            }
        } else if (tenant) {
            tenant.config = {};
        }

        const encryptionSecret = env.ENCRYPTION_SECRET || 'fallback-secret-for-dev-only';
        const cryptoService = new CryptoService(encryptionSecret);
        const decryptedToken = await cryptoService.decrypt(tenant.notion_access_token);

        const notion = new NotionService(decryptedToken);

        for (const page of pages) {
            try {
                await processPage(page, tenant, env, notion, context);
            } catch (pageErr) {
                console.error(`  Failed to process page ${page.id}:`, pageErr);
            } finally {
                // Always increment processed count even if failed, to avoid getting stuck in "syncing"
                const currentTotal = await env.DB.prepare('SELECT sync_total, sync_processed FROM tenants WHERE id = ?').bind(tenantId).first() as any;
                await tenantService.updateSyncProgress(tenantId, (currentTotal?.sync_processed || 0) + 1, currentTotal?.sync_total || pages.length);
            }
        }

        // check if overall sync is complete
        const finalCheck = await env.DB.prepare('SELECT sync_processed, sync_total FROM tenants WHERE id = ?').bind(tenantId).first() as any;
        if (finalCheck && finalCheck.sync_processed >= finalCheck.sync_total) {
            await tenantService.updateSyncStatus(tenantId, 'idle');
            console.log(`Sync for ${tenantId} marked as IDLE.`);
        }

    } catch (err) {
        console.error(`Chunk Worker failed for ${tenantId}:`, err);
    }
}

export async function processPage(page: any, tenant: any, env: Env, notion: NotionService, context: SyncContext) {
    const tenantId = tenant.id;
    const config = tenant.config || {};
    const pageId = page.id;
    const lastEditedTimeMs = new Date(page.last_edited_time).getTime();
    const sourceContext = page._sourceContext || {};
    const sourceId = sourceContext.sourceId || null;
    const autoTag = sourceContext.autoTag;

    // --- SECONDARY OPTIMIZATION: Per-Page Skip ---
    const existing = await env.DB.prepare('SELECT last_edited_time FROM posts WHERE id = ?').bind(pageId).first() as any;
    if (existing && existing.last_edited_time >= lastEditedTimeMs) {
        console.log(`    [Skip] Page ${pageId} is already up to date.`);
        return;
    }

    console.log(`  Syncing Page: ${pageId} (Source: ${sourceId})`);

    const blocks = await notion.getBlocks(pageId, 0, context);
    // Process Page Level Assets (Icon & Cover)
    const { coverUrl, iconUrl } = await processPageAssets(page, tenantId, env, context);
    if (coverUrl) page._coverUrl = coverUrl;
    if (iconUrl) page.icon = { type: 'file', file: { url: iconUrl } };

    await processBlocksForAssets(blocks, tenantId, pageId, env, context, notion);

    const parsedBlocks = NotionParser.parseBlocks(blocks);
    const props = page.properties;

    // 1. Map Notion Properties
    const mapped = mapNotionProperties(props, pageId, autoTag);
    let { summary, tags, seoDescription } = mapped;
    const { title, slug, status, publishedAt, seoTitle, canonicalUrl, noindex } = mapped;

    // 2. Run AI Analysis if applicable
    const aiResult = await runAISEOAnalysis({
        tenant, env, title, parsedBlocks, summary, seoDescription, tags, pageId
    });

    summary = aiResult.summary;
    seoDescription = aiResult.seoDescription;
    tags = aiResult.tags;
    const { aiSeoStatus, aiSeoAdvice } = aiResult;

    const notionUrl = page.url;
    const icon = page.icon ? JSON.stringify(page.icon) : null;
    const createdTime = new Date(page.created_time).getTime();
    const lastEditedTime = new Date(page.last_edited_time).getTime();
    const archived = page.archived ? 1 : 0;
    const inTrash = page.in_trash ? 1 : 0;

    const postService = new PostService(env.DB);
    const statements: any[] = [];

    statements.push(postService.getUpsertPostStatement({
        id: pageId,
        tenant_id: tenantId,
        source_id: sourceId,
        slug,
        title,
        summary,
        tags,
        content_json: parsedBlocks,
        cover_image_url: page._coverUrl,
        published_at: publishedAt,
        last_edited_time: lastEditedTime,
        status,
        notion_url: notionUrl,
        icon,
        created_time: createdTime,
        archived,
        inTrash,
        seo_title: seoTitle,
        seo_description: seoDescription,
        canonical_url: canonicalUrl,
        noindex,
        ai_seo_status: aiSeoStatus,
        ai_seo_advice: aiSeoAdvice
    }));

    collectBlockStatements(parsedBlocks, pageId, tenantId, null, env, statements);

    context.requestCount++;
    await env.DB.batch(statements);
}

export function collectBlockStatements(blocks: any[], postId: string, tenantId: string, parentId: string | null, env: Env, statements: any[]) {
    const postService = new PostService(env.DB);
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        statements.push(postService.getUpsertBlockStatement({
            id: block.id,
            post_id: postId,
            tenant_id: tenantId,
            parent_id: parentId,
            type: block.type,
            content: block.content,
            created_time: block.created_time,
            last_edited_time: block.last_edited_time,
            order_index: i
        }));

        if (block.children && block.children.length > 0) {
            collectBlockStatements(block.children, postId, tenantId, block.id, env, statements);
        }
    }
}
