import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflareService } from './cloudflare';

describe('CloudflareService - SaaS Worker Configuration', () => {
    let cfService: CloudflareService;
    const mockEnv = {
        CLOUDFLARE_API_TOKEN: 'mock-token',
        CLOUDFLARE_ZONE_ID: 'mock-zone-id'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.fetch = vi.fn();
        cfService = new CloudflareService(mockEnv);
    });

    it('should handle O2O detection and fallback to SaaS worker configuration', async () => {
        const hostname = 'o2o.example.com';

        // 1. Mock first attempt failing with 1460 (O2O)
        (fetch as any)
            .mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    result: [] // No existing hostname
                })
            })
            .mockResolvedValueOnce({
                json: async () => ({
                    success: false,
                    errors: [{ code: 1460, message: 'O2O detected' }]
                })
            })
            // 2. Mock retry with CNAME method success
            .mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    result: { id: 'new-id', hostname, ssl: { method: 'cname' } }
                })
            });

        const result = await cfService.upsertCustomHostname(hostname);

        expect(result.success).toBe(true);
        // Verify multiple calls were made (existing check, post attempt, post retry)
        expect(fetch).toHaveBeenCalledTimes(3);

        // Verify retry used cname method
        const retryCall = (fetch as any).mock.calls[2];
        const body = JSON.parse(retryCall[1].body);
        expect(body.ssl.method).toBe('cname');
    });

    it('should be able to check fallback origin status', async () => {
        (fetch as any).mockResolvedValueOnce({
            json: async () => ({
                success: true,
                result: {
                    origin_id: 'worker-origin-id',
                    status: 'active'
                }
            })
        });

        // This method doesn't exist yet, we'll implement it
        const status = await (cfService as any).getFallbackOrigin();
        expect(status.success).toBe(true);
        expect(status.result.origin_id).toBeDefined();
    });
});
