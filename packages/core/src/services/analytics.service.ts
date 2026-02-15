export interface AnalyticsRecord {
    tenantId: string;
    path: string;
    viewerHash: string;
    referrer?: string;
    postId?: string;
}

export class AnalyticsService {
    constructor(private db: any) { }

    async logView(data: AnalyticsRecord) {
        if (!this.db) return;

        try {
            await this.db
                .prepare(`
          INSERT INTO page_views (id, tenant_id, path, viewer_hash, referrer, post_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
                .bind(
                    crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                    data.tenantId,
                    data.path,
                    data.viewerHash,
                    data.referrer || null,
                    data.postId || null
                )
                .run();
        } catch (e) {
            console.error('Failed to log analytics:', e);
        }
    }

    async getSummary(tenantId: string, days: number = 7) {
        if (!this.db) return { views: 0, visitors: 0 };

        const result = await this.db
            .prepare(`
        SELECT 
          COUNT(*) as total_views,
          COUNT(DISTINCT viewer_hash) as unique_visitors
        FROM page_views 
        WHERE tenant_id = ? 
        AND timestamp >= datetime('now', ?)
      `)
            .bind(tenantId, `-${days} days`)
            .first();

        return {
            views: result?.total_views || 0,
            visitors: result?.unique_visitors || 0
        };
    }
}
