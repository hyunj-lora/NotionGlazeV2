import type { APIRoute } from 'astro';
import { AdminService } from "@notionglaze/core";

export const GET: APIRoute = async ({ locals, cookies, request }) => {
    const ADMIN_TOKEN = "notionglaze-master-key";

    // Auth Check
    const url = new URL(request.url);
    const providedToken = url.searchParams.get("key") || cookies.get("admin_session")?.value;

    if (providedToken !== ADMIN_TOKEN) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const db = (locals as any).runtime?.env?.DB;

    if (!db) {
        return new Response(JSON.stringify({ error: "DB not available" }), { status: 500 });
    }

    try {
        const adminService = new AdminService(db);
        const stats = await adminService.getStats();
        const tenants = await adminService.getTenants();

        // Generate pseudo-logs based on tenant status
        // Sort by last_synced_at or updated_at if available
        const recentActivity = tenants
            .filter(t => t.last_synced_at || t.last_sync_error)
            .sort((a, b) => {
                const timeA = a.last_synced_at ? new Date(a.last_synced_at).getTime() : 0;
                const timeB = b.last_synced_at ? new Date(b.last_synced_at).getTime() : 0;
                return timeB - timeA;
            })
            .slice(0, 10)
            .map(t => {
                const isError = t.sync_status === 'error' || t.sync_status === 'failed';
                const time = t.last_synced_at ? new Date(t.last_synced_at).toLocaleTimeString() : 'Unknown Time';
                return {
                    time,
                    type: isError ? 'ERROR' : 'INFO',
                    message: isError
                        ? `Sync failed for ${t.subdomain || t.id.slice(0, 8)}: ${t.last_sync_error}`
                        : `Synced ${t.post_count} posts for ${t.subdomain || t.id.slice(0, 8)} successfully.`
                };
            });

        return new Response(JSON.stringify({
            stats,
            tenants,
            logs: recentActivity
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (e) {
        const error = e instanceof Error ? e.message : "Internal Error";
        return new Response(JSON.stringify({ error }), { status: 500 });
    }
};
