import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainService as DomainManager } from '@notionglaze/core';
import { CloudflareService } from '@notionglaze/core';

const mockGetStatus = vi.fn();
const mockDeleteCustomHostname = vi.fn();
const mockUpsertCustomHostname = vi.fn();

class MockCloudflareService {
    getStatus = mockGetStatus;
    deleteCustomHostname = mockDeleteCustomHostname;
    upsertCustomHostname = mockUpsertCustomHostname;
    getZoneId = vi.fn();
    getCustomHostname = vi.fn();
    createCustomHostname = vi.fn();
    isDomainActive = vi.fn();
}

vi.mock('../utils', () => ({
    fetchDnsJSON: vi.fn(),
}));

import { fetchDnsJSON } from '../utils';

describe('DomainManager - Advanced O2O Scenarios', () => {
    let domainManager: DomainManager;
    let mockCfInstance: any;
    const mockEnv = { CLOUDFLARE_API_TOKEN: 'token', CLOUDFLARE_ZONE_ID: 'zone' };

    beforeEach(() => {
        vi.clearAllMocks();
        domainManager = new DomainManager(mockEnv);
        (domainManager as any).cf = new MockCloudflareService();
        mockCfInstance = (domainManager as any).cf;
    });

    it('should detect Error 1016 (Origin DNS Error) when Active but probe fails', async () => {
        const hostname = 'humanerd.kr';
        mockCfInstance.getStatus.mockResolvedValue({
            hostname_status: 'active',
            ssl_status: 'active',
        });

        // Mock DNS pointing correctly
        (fetchDnsJSON as any).mockImplementation((name: string, type: string) => {
            if (type === 'CNAME') return { Answer: [{ data: 'proxy.notionglaze.cc' }] };
            return { Answer: [] };
        });

        // Mock probe failure (Origin DNS Error simulation)
        vi.spyOn(domainManager, 'probeConnection').mockResolvedValue(false);

        const result = await domainManager.getUnifiedStatus(hostname);
        const advice = result.diagnostics?.advice || [];

        expect(advice.some(a => a.includes('연결 상태 확인'))).toBe(true);
        expect(advice.some(a => a.includes('서버 응답이 지연'))).toBe(true);
    });

    it('should handle Error 1406 (Duplicate Custom Hostname) and advise Liberation', async () => {
        const hostname = 'duplicate.com';
        mockCfInstance.getStatus.mockResolvedValue({
            error: 'Cloudflare API Error: custom_hostname.error.duplicate_hostname (1406)'
        });

        await expect(domainManager.getUnifiedStatus(hostname))
            .rejects.toThrow(/1406/);
    });

    it('should handle Error 1014 (Cross-User Banned) with informative message', async () => {
        const hostname = 'cross-user.com';
        mockCfInstance.getStatus.mockResolvedValue({
            error: 'Cloudflare API Error: custom_hostname.error.cname_cross_user_banned (1014)'
        });

        await expect(domainManager.getUnifiedStatus(hostname))
            .rejects.toThrow(/1014/);
    });

    it('should provide SSL alignment advice for O2O Active domains', async () => {
        const hostname = 'o2o-ssl.com';
        mockCfInstance.getStatus.mockResolvedValue({
            hostname_status: 'active',
            ssl_status: 'active',
        });
        (fetchDnsJSON as any).mockResolvedValue({ Answer: [], ns: ['cloudflare.com'] });
        vi.spyOn(domainManager, 'probeConnection').mockResolvedValue(false);

        const result = await domainManager.getUnifiedStatus(hostname);
        const advice = result.diagnostics?.advice || [];
        expect(advice.some(a => a.includes('Full (Strict)'))).toBe(true);
    });

    it('should include Cloudflare internal verification errors in diagnostics', async () => {
        const hostname = 'errors.com';
        mockCfInstance.getStatus.mockResolvedValue({
            hostname_status: 'pending',
            ssl_status: 'pending',
            verification_errors: [{ message: 'custom hostname does not CNAME to this zone' }]
        });
        (fetchDnsJSON as any).mockResolvedValue({ Answer: [] });

        const result = await domainManager.getUnifiedStatus(hostname);
        const advice = result.diagnostics?.advice || [];
        expect(advice.some(a => a.includes('custom hostname does not CNAME to this zone'))).toBe(true);
    });
});
