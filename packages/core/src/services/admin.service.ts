
export interface AdminStats {
    totalTenants: number;
    totalPosts: number;
    totalSources: number;
    syncFailures: number;
    syncingNow: number;
    painPoints: number;
    proUsers: number;
    mrr: number;
}

export interface AdminTenant {
    id: string;
    subdomain: string;
    custom_domain: string | null;
    sync_status: string;
    last_synced_at: string | null;
    plan: string;
    last_sync_error: string | null;
    post_count: number;
    source_count: number;
}

export interface PainPoint {
    id: number;
    email: string;
    content: string;
    created_at: string;
}

export class AdminService {
    constructor(private db: any) { }

    async getStats(): Promise<AdminStats> {
        const tenantCount = await this.db.prepare("SELECT COUNT(*) as count FROM tenants").first();
        const postCount = await this.db.prepare("SELECT COUNT(*) as count FROM posts").first();
        const failCount = await this.db.prepare("SELECT COUNT(*) as count FROM tenants WHERE sync_status = 'failed' OR sync_status = 'error'").first();
        const proCount = await this.db.prepare("SELECT COUNT(*) as count FROM tenants WHERE plan = 'pro'").first();
        const sourceCount = await this.db.prepare("SELECT COUNT(*) as count FROM tenant_sources").first();
        const ppCount = await this.db.prepare("SELECT COUNT(*) as count FROM pain_points").first();
        const syncingCount = await this.db.prepare("SELECT COUNT(*) as count FROM tenants WHERE sync_status = 'syncing'").first();

        return {
            totalTenants: tenantCount?.count || 0,
            totalPosts: postCount?.count || 0,
            totalSources: sourceCount?.count || 0,
            syncFailures: failCount?.count || 0,
            syncingNow: syncingCount?.count || 0,
            painPoints: ppCount?.count || 0,
            proUsers: proCount?.count || 0,
            mrr: (proCount?.count || 0) * 9,
        };
    }

    async getTenants(): Promise<AdminTenant[]> {
        const { results } = await this.db.prepare(`
            SELECT 
                t.id, t.subdomain, t.custom_domain, t.sync_status, t.last_synced_at, t.plan, t.last_sync_error,
                (SELECT COUNT(*) FROM posts p WHERE p.tenant_id = t.id) as post_count,
                (SELECT COUNT(*) FROM tenant_sources ts WHERE ts.tenant_id = t.id) as source_count
            FROM tenants t 
            ORDER BY t.last_synced_at DESC LIMIT 50
        `).all();
        return results || [];
    }

    async getPainPoints(): Promise<PainPoint[]> {
        const { results } = await this.db.prepare("SELECT * FROM pain_points ORDER BY created_at DESC LIMIT 50").all();
        return results || [];
    }
}
