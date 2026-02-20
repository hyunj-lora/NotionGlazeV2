import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflareService } from '@notionglaze/core';

describe('CloudflareService', () => {
    let cf: CloudflareService;
    const mockEnv = {
        CLOUDFLARE_API_TOKEN: 'fake-token',
        CLOUDFLARE_ZONE_ID: 'fake-zone'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        cf = new CloudflareService(mockEnv);
        // Mock global fetch
        global.fetch = vi.fn();
    });

    it('should delete a custom hostname', async () => {
        const hostname = 'test.com';
        const hostnameId = 'h-123';

        // 1. Mock GET to find ID
        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                result: [{ id: hostnameId, hostname }]
            })
        });

        // 2. Mock DELETE
        (fetch as any).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true })
        });

        const result = await cf.deleteCustomHostname(hostname);
        expect(result.success).toBe(true);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/custom_hostnames/${hostnameId}`),
            expect.objectContaining({ method: 'DELETE' })
        );
    });
});
