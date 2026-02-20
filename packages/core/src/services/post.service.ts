import type { SiteConfig } from "../types";

export interface HomeData {
    type: 'feed' | 'page';
    post?: any;
    posts?: any[];
    idToSlugMap?: Record<string, string>;
}

export class PostService {
    constructor(private db: D1Database) { }

    async resolveHomeData(tenantId: string, config: SiteConfig): Promise<HomeData> {
        // 1. Check for custom home page
        if (config.home_page_id) {
            const post = await this.db
                .prepare("SELECT * FROM posts WHERE tenant_id = ? AND id = ?")
                .bind(tenantId, config.home_page_id)
                .first();

            if (post) {
                const slugMap = await this.getSlugMap(tenantId);
                return {
                    type: 'page',
                    post: {
                        ...post,
                        tags: this.safeParse(post.tags as string, []),
                        content_json: this.safeParse(post.content_json as string, [])
                    },
                    idToSlugMap: slugMap
                };
            }
        }

        // 2. Fallback to default blog feed
        const { results: posts } = await this.db
            .prepare(
                "SELECT * FROM posts WHERE tenant_id = ? AND status = 'Published' AND archived = 0 AND in_trash = 0 ORDER BY published_at DESC, last_edited_time DESC"
            )
            .bind(tenantId)
            .all();

        return {
            type: 'feed',
            posts: (posts || []).map((p: any) => ({
                ...p,
                tags: this.safeParse(p.tags as string, [])
            }))
        };
    }

    async getSlugMap(tenantId: string): Promise<Record<string, string>> {
        const { results } = await this.db
            .prepare("SELECT id, slug FROM posts WHERE tenant_id = ?")
            .bind(tenantId)
            .all();

        return Object.fromEntries(
            (results || []).map((p: any) => [p.id.replace(/-/g, ""), p.slug])
        );
    }

    async getPostsSimple(tenantId: string) {
        const { results } = await this.db
            .prepare("SELECT id, title, slug, status FROM posts WHERE tenant_id = ? AND status = 'Published' AND archived = 0 AND in_trash = 0 ORDER BY title ASC")
            .bind(tenantId)
            .all();
        return results || [];
    }

    async upsertPost(post: any): Promise<void> {
        await this.db.prepare(`
            INSERT INTO posts (
                id, tenant_id, source_id, slug, title, summary, tags, content_json, 
                cover_image_url, 
                published_at, last_edited_time, status, notion_url,
                icon, created_time, archived, in_trash,
                seo_title, seo_description,
                canonical_url, noindex, ai_seo_status, ai_seo_advice
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                source_id = excluded.source_id,
                title = excluded.title,
                slug = excluded.slug,
                summary = excluded.summary,
                tags = excluded.tags,
                content_json = excluded.content_json,
                published_at = excluded.published_at,
                last_edited_time = excluded.last_edited_time,
                status = excluded.status,
                notion_url = excluded.notion_url,
                icon = excluded.icon,
                created_time = excluded.created_time,
                archived = excluded.archived,
                in_trash = excluded.in_trash,
                seo_title = excluded.seo_title,
                seo_description = excluded.seo_description,
                canonical_url = excluded.canonical_url,
                noindex = excluded.noindex,
                ai_seo_status = excluded.ai_seo_status,
                ai_seo_advice = excluded.ai_seo_advice
        `).bind(
            post.id, post.tenant_id, post.source_id, post.slug, post.title, post.summary,
            JSON.stringify(post.tags), JSON.stringify(post.content_json),
            post.cover_image_url,
            post.published_at, post.last_edited_time, post.status, post.notion_url,
            post.icon, post.created_time, post.archived, post.in_trash,
            post.seo_title, post.seo_description,
            post.canonical_url, post.noindex ? 1 : 0, post.ai_seo_status, post.ai_seo_advice
        ).run();
    }

    async upsertBlock(block: any): Promise<void> {
        await this.db.prepare(`
            INSERT INTO blocks (
                id, post_id, tenant_id, parent_id, type, content_json, 
                created_time, last_edited_time, order_index
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                content_json = excluded.content_json,
                last_edited_time = excluded.last_edited_time,
                order_index = excluded.order_index
        `).bind(
            block.id,
            block.post_id,
            block.tenant_id,
            block.parent_id,
            block.type,
            JSON.stringify(block.content),
            block.created_time,
            block.last_edited_time,
            block.order_index
        ).run();
    }

    async getLatestPostTime(tenantId: string, sourceId: string): Promise<number> {
        const result = await this.db
            .prepare("SELECT last_edited_time FROM posts WHERE tenant_id = ? AND source_id = ? ORDER BY last_edited_time DESC LIMIT 1")
            .bind(tenantId, sourceId)
            .first();
        return (result?.last_edited_time as number) || 0;
    }

    private val(v: any) {
        return v === undefined ? null : v;
    }

    getUpsertPostStatement(post: any): D1PreparedStatement {
        return this.db.prepare(`
            INSERT INTO posts (
                id, tenant_id, source_id, slug, title, summary, tags, content_json, 
                cover_image_url, 
                published_at, last_edited_time, status, notion_url,
                icon, created_time, archived, in_trash,
                seo_title, seo_description,
                canonical_url, noindex, ai_seo_status, ai_seo_advice
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                source_id = excluded.source_id,
                title = excluded.title,
                slug = excluded.slug,
                summary = excluded.summary,
                tags = excluded.tags,
                content_json = excluded.content_json,
                published_at = excluded.published_at,
                last_edited_time = excluded.last_edited_time,
                status = excluded.status,
                notion_url = excluded.notion_url,
                icon = excluded.icon,
                created_time = excluded.created_time,
                archived = excluded.archived,
                in_trash = excluded.in_trash,
                seo_title = excluded.seo_title,
                seo_description = excluded.seo_description,
                canonical_url = excluded.canonical_url,
                noindex = excluded.noindex,
                ai_seo_status = excluded.ai_seo_status,
                ai_seo_advice = excluded.ai_seo_advice
        `).bind(
            this.val(post.id), this.val(post.tenant_id), this.val(post.source_id), this.val(post.slug), this.val(post.title), this.val(post.summary),
            JSON.stringify(post.tags || []), JSON.stringify(post.content_json || []),
            this.val(post.cover_image_url),
            this.val(post.published_at), this.val(post.last_edited_time), this.val(post.status), this.val(post.notion_url),
            this.val(post.icon), this.val(post.created_time), this.val(post.archived), this.val(post.in_trash || post.inTrash),
            this.val(post.seo_title), this.val(post.seo_description),
            this.val(post.canonical_url), post.noindex ? 1 : 0, this.val(post.ai_seo_status), this.val(post.ai_seo_advice)
        );
    }

    getUpsertBlockStatement(block: any): D1PreparedStatement {
        return this.db.prepare(`
            INSERT INTO blocks (
                id, post_id, tenant_id, parent_id, type, content_json, 
                created_time, last_edited_time, order_index
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                content_json = excluded.content_json,
                last_edited_time = excluded.last_edited_time,
                order_index = excluded.order_index
        `).bind(
            this.val(block.id),
            this.val(block.post_id),
            this.val(block.tenant_id),
            this.val(block.parent_id),
            this.val(block.type),
            JSON.stringify(block.content || {}),
            this.val(block.created_time),
            this.val(block.last_edited_time),
            this.val(block.order_index)
        );
    }

    private safeParse(json: string | null, fallback: any) {
        if (!json) return fallback;
        try {
            return JSON.parse(json);
        } catch (e) {
            return fallback;
        }
    }
}
