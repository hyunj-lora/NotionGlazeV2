import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainManager } from './domain';
import { CloudflareService } from './cloudflare';

vi.mock('./cloudflare', () => {
    const Mock = vi.fn();
    Mock.prototype.deleteCustomHostname = vi.fn();
    Mock.prototype.upsertCustomHostname = vi.fn();
    Mock.prototype.getStatus = vi.fn();
    return { CloudflareService: Mock };
});

describe('DomainManager Phase 3', () => {
    let domainManager: DomainManager;
    let mockCfInstance: any;
    const mockEnv = { CLOUDFLARE_API_TOKEN: 'token', CLOUDFLARE_ZONE_ID: 'zone' };

    beforeEach(() => {
        vi.clearAllMocks();
        domainManager = new DomainManager(mockEnv);
        mockCfInstance = (CloudflareService as any).mock.results[0].value;
        global.fetch = vi.fn();
    });

    it('should reset a domain by deleting and re-creating it', async () => {
        const hostname = 'test.com';
        mockCfInstance.deleteCustomHostname.mockResolvedValue({ success: true });
        mockCfInstance.upsertCustomHostname.mockResolvedValue({ success: true });

        const result = await domainManager.resetDomain(hostname);

        expect(result.success).toBe(true);
        expect(mockCfInstance.deleteCustomHostname).toHaveBeenCalledWith(hostname);
        expect(mockCfInstance.upsertCustomHostname).toHaveBeenCalledWith(hostname);
    });

    it('should probe connection via HTTP and return true if healthy', async () => {
        const hostname = 'test.com';
        (fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ healthy: true })
        });

        const isHealthy = await domainManager.probeConnection(hostname);
        expect(isHealthy).toBe(true);
        expect(fetch).toHaveBeenCalledWith(
            `https://${hostname}/_notion_glaze_health`,
            expect.objectContaining({ method: 'GET' })
        );
    });

    it('should return false if HTTP probe fails', async () => {
        const hostname = 'test.com';
        (fetch as any).mockRejectedValueOnce(new Error('Network error'));

        const isHealthy = await domainManager.probeConnection(hostname);
        expect(isHealthy).toBe(false);
    });
});
