import type { Tenant, SiteConfig } from "../types";

export class TenantService {
    constructor(private db: D1Database) { }

    async getTenantByOwnerId(ownerId: string): Promise<Tenant | null> {
        return await this.db
            .prepare("SELECT * FROM tenants WHERE owner_id = ?")
            .bind(ownerId)
            .first();
    }

    async getTenantById(id: string): Promise<Tenant | null> {
        return await this.db
            .prepare("SELECT * FROM tenants WHERE id = ?")
            .bind(id)
            .first();
    }

    async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
        return await this.db
            .prepare("SELECT * FROM tenants WHERE LOWER(subdomain) = ?")
            .bind(subdomain.toLowerCase())
            .first();
    }

    async getTenantByCustomDomain(domain: string): Promise<Tenant | null> {
        return await this.db
            .prepare("SELECT * FROM tenants WHERE LOWER(custom_domain) = ?")
            .bind(domain.toLowerCase())
            .first();
    }

    async updateTenant(
        tenantId: string,
        updates: Partial<SiteConfig> & { subdomain?: string | null; custom_domain?: string | null }
    ): Promise<SiteConfig> {
        const tenant = await this.getTenantById(tenantId);
        if (!tenant) throw new Error("Tenant not found");

        const currentConfig: SiteConfig = tenant.config_json ? JSON.parse(tenant.config_json) : {};

        const { subdomain, custom_domain, ...configUpdates } = updates as any;
        const newConfig = { ...currentConfig, ...configUpdates };

        const query = `
            UPDATE tenants 
            SET config_json = ?, 
                subdomain = ?, 
                custom_domain = ?,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;

        await this.db
            .prepare(query)
            .bind(
                JSON.stringify(newConfig),
                subdomain === undefined ? tenant.subdomain : subdomain,
                custom_domain === undefined ? tenant.custom_domain : custom_domain,
                tenantId
            )
            .run();

        return newConfig;
    }

    async getTenantStats(tenantId: string) {
        try {
            const counts = await this.db
                .prepare(
                    "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Published' THEN 1 ELSE 0 END) as published FROM posts WHERE tenant_id = ?"
                )
                .bind(tenantId)
                .first();
            return {
                totalPosts: (counts?.total as number) || 0,
                publishedPosts: (counts?.published as number) || 0,
            };
        } catch (e) {
            console.error("TenantService.getTenantStats Error:", e);
            return { totalPosts: 0, publishedPosts: 0 };
        }
    }

    async getRecentPosts(tenantId: string, limit: number = 5) {
        try {
            const res = await this.db
                .prepare(
                    "SELECT id, title, slug, status, last_edited_time FROM posts WHERE tenant_id = ? ORDER BY last_edited_time DESC LIMIT ?"
                )
                .bind(tenantId, limit)
                .all();
            return res?.results || [];
        } catch (e) {
            console.error("TenantService.getRecentPosts Error:", e);
            return [];
        }
    }

    async startSync(id: string): Promise<void> {
        await this.db
            .prepare("UPDATE tenants SET sync_status = 'syncing', last_sync_error = NULL, sync_progress = 0, sync_heartbeat = ? WHERE id = ?")
            .bind(Date.now(), id)
            .run();
    }

    async updateSyncProgress(id: string, processed: number, total: number): Promise<void> {
        const progress = Math.round((processed * 100) / total);
        await this.db
            .prepare("UPDATE tenants SET sync_processed = ?, sync_total = ?, sync_progress = ?, sync_heartbeat = ? WHERE id = ?")
            .bind(processed, total, progress, Date.now(), id)
            .run();
    }

    async getSources(tenantId: string): Promise<any[]> {
        const { results } = await this.db
            .prepare("SELECT * FROM tenant_sources WHERE tenant_id = ?")
            .bind(tenantId)
            .all();
        return results || [];
    }

    async updateSyncStatus(id: string, status: string, error?: string): Promise<void> {
        await this.db
            .prepare("UPDATE tenants SET sync_status = ?, last_sync_error = ?, last_synced_at = ? WHERE id = ?")
            .bind(status, error || null, Date.now(), id)
            .run();
    }

    async updateSyncMetadata(id: string, total: number): Promise<void> {
        await this.db
            .prepare("UPDATE tenants SET sync_total = ?, sync_processed = 0, sync_heartbeat = ? WHERE id = ?")
            .bind(total, Date.now(), id)
            .run();
    }

    async updateOwnerId(tenantId: string, ownerId: string): Promise<void> {
        await this.db
            .prepare("UPDATE tenants SET owner_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(ownerId, tenantId)
            .run();
    }
}
