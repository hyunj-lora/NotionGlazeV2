import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantService, SessionService } from '@notionglaze/core';

const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    run: vi.fn(),
};

describe('Refactored Services QA', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('TenantService', () => {
        const service = new TenantService(mockDb as any);

        it('should fetch tenant by owner_id', async () => {
            const mockTenant = { id: 'tenant-1', owner_id: 'user-1', plan: 'pro' };
            mockDb.first.mockResolvedValueOnce(mockTenant);

            const result = await service.getTenantByOwnerId('user-1');
            expect(result).toEqual(mockTenant);
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM tenants WHERE owner_id = ?'));
        });

        it('should fetch tenant by subdomain', async () => {
            const mockTenant = { id: 'tenant-1', subdomain: 'test' };
            mockDb.first.mockResolvedValueOnce(mockTenant);

            const result = await service.getTenantBySubdomain('Test');
            expect(result).toEqual(mockTenant);
            expect(mockDb.bind).toHaveBeenCalledWith('test');
        });
    });

    describe('SessionService', () => {
        const service = new SessionService(mockDb as any);

        it('should fetch session by id', async () => {
            const mockSession = { user_id: 'user-1', expires_at: '2026-01-01' };
            mockDb.first.mockResolvedValueOnce(mockSession);

            const result = await service.getSession('session-1');
            expect(result).toEqual(mockSession);
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT user_id, expires_at FROM sessions'));
        });

        it('should create session', async () => {
            mockDb.run.mockResolvedValueOnce({ success: true });

            await service.createSession('s1', 'u1', 'e1');
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO sessions'));
            expect(mockDb.bind).toHaveBeenCalledWith('s1', 'u1', 'e1');
        });
    });
});
