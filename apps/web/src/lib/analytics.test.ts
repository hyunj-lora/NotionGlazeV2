import { describe, it, expect, vi } from 'vitest';
import { AnalyticsService } from '@notionglaze/core';

describe('AnalyticsService', () => {
    const mockDb = {
        prepare: vi.fn().mockReturnValue({
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ success: true }),
            first: vi.fn().mockResolvedValue({ total_views: 10, unique_visitors: 5 })
        })
    };

    it('should log a view record', async () => {
        const service = new AnalyticsService(mockDb);
        const viewData = {
            tenantId: 'user_1',
            path: '/hello-world',
            viewerHash: 'abc-123',
            referrer: 'https://google.com'
        };

        await service.logView(viewData);
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO page_views'));
    });

    it('should get summary for a tenant', async () => {
        const service = new AnalyticsService(mockDb);
        const summary = await service.getSummary('user_1', 7);

        expect(summary.views).toBe(10);
        expect(summary.visitors).toBe(5);
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });
});
