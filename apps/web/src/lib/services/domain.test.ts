import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainManager } from './domain';
import { CloudflareService } from './cloudflare';

vi.mock('./cloudflare', () => {
    const Mock = vi.fn();
    Mock.prototype.getStatus = vi.fn();
    return { CloudflareService: Mock };
});

vi.mock('../utils', () => ({
    fetchDnsJSON: vi.fn(),
}));

import { fetchDnsJSON } from '../utils';

describe('DomainManager', () => {
    let domainManager: DomainManager;
    let mockCfInstance: any;
    const mockEnv = { CLOUDFLARE_API_TOKEN: 'token', CLOUDFLARE_ZONE_ID: 'zone' };

    beforeEach(() => {
        vi.clearAllMocks();
        domainManager = new DomainManager(mockEnv);
        // Access the instance created by DomainManager constructor
        mockCfInstance = (CloudflareService as any).mock.results[0].value;
    });

    it('should return no_domain if hostname is empty', async () => {
        const result = await domainManager.getUnifiedStatus('');
        expect(result.status).toBe('no_domain');
    });

    it('should generate unified records for a new domain', async () => {
        const hostname = 'blog.example.com';

        mockCfInstance.getStatus.mockResolvedValue({
            hostname_status: 'pending',
            ssl_status: 'pending',
            ssl_validation: [{ hostname: '_acme-challenge.blog.example.com', value: 'token-123' }],
            ownership_verification: { name: 'notionglaze-verification', type: 'txt', value: 'verify-456' }
        });

        (fetchDnsJSON as any).mockResolvedValue({ Answer: [] });

        const result = await domainManager.getUnifiedStatus(hostname);

        expect(result.hostname).toBe(hostname);
        expect(result.state).toBe('PENDING_DNS');

        // Should contain Connection and Verification records
        expect(result.records).toContainEqual(expect.objectContaining({
            type: 'CNAME',
            host: 'blog',
            required_value: 'proxy.notionglaze.cc'
        }));

        expect(result.records).toContainEqual(expect.objectContaining({
            type: 'CNAME',
            host: '_acme-challenge.blog',
            required_value: 'token-123'
        }));
    });

    it('should detect ACTIVE state when DNS and SSL are configured', async () => {
        const hostname = 'blog.example.com';
        mockCfInstance.getStatus.mockResolvedValue({
            hostname_status: 'active',
            ssl_status: 'active',
        });

        (fetchDnsJSON as any).mockImplementation((name: string, type: string) => {
            if (type === 'CNAME') return { Answer: [{ data: 'proxy.notionglaze.cc' }] };
            return { Answer: [] };
        });

        const result = await domainManager.getUnifiedStatus(hostname);

        expect(result.state).toBe('ACTIVE');
    });

    describe('Phase 2: Robust Parsing', () => {
        it('should correctly handle multi-part TLDs (e.g., .co.kr)', async () => {
            const hostname = 'blog.mysite.co.kr';
            mockCfInstance.getStatus.mockResolvedValue({
                hostname_status: 'pending',
                ssl_status: 'pending',
            });
            (fetchDnsJSON as any).mockResolvedValue({ Answer: [] });

            const result = await domainManager.getUnifiedStatus(hostname);

            // Host should be 'blog', not 'blog.mysite'
            expect(result.records).toContainEqual(expect.objectContaining({
                type: 'CNAME',
                host: 'blog',
                required_value: 'proxy.notionglaze.cc'
            }));
        });

        it('should correctly handle apex domains with multi-part TLDs', async () => {
            const hostname = 'mysite.co.kr';
            mockCfInstance.getStatus.mockResolvedValue({
                hostname_status: 'pending',
                ssl_status: 'pending',
            });
            (fetchDnsJSON as any).mockResolvedValue({ Answer: [] });

            const result = await domainManager.getUnifiedStatus(hostname);

            expect(result.records).toContainEqual(expect.objectContaining({
                type: 'A',
                host: '@'
            }));
        });
    });

    describe('Phase 2: Error Mapping', () => {
        it('should map technical Cloudflare errors to friendly messages', async () => {
            mockCfInstance.getStatus.mockResolvedValue({
                error: 'Cloudflare API Error: custom_hostname.error.duplicate_hostname (1001)'
            });

            await expect(domainManager.getUnifiedStatus('example.com'))
                .rejects.toThrow(/이미 다른 사용자가 등록한 도메인입니다/);
        });
    });
});
