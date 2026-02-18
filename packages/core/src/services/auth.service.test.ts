import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';

const mockDb = {
    prepare: vi.fn(),
};

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService(mockDb as any);
        vi.clearAllMocks();
    });

    it('should create session', async () => {
        // Mock SessionService.createSession -> INSERT
        mockDb.prepare.mockReturnValue({
            bind: vi.fn().mockReturnValue({
                run: vi.fn().mockResolvedValue(undefined)
            })
        });

        const result = await authService.createSession('u1');
        expect(result.sessionId).toBeDefined();
        expect(result.userId).toBe('u1');
        expect(result.cookies).toHaveLength(2);
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO sessions'));
    });

    it('should verify valid session', async () => {
        const mockSession = { user_id: 'u1', expires_at: new Date(Date.now() + 10000).toISOString() };
        mockDb.prepare.mockReturnValue({
            bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(mockSession)
            })
        });

        const userId = await authService.verifySession('s1');
        expect(userId).toBe('u1');
    });

    it('should reject expired session', async () => {
        const mockSession = { user_id: 'u1', expires_at: new Date(Date.now() - 10000).toISOString() };
        mockDb.prepare.mockReturnValue({
            bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(mockSession)
            })
        });

        const userId = await authService.verifySession('s1');
        expect(userId).toBeNull();
    });

    it('should recover session from cookie', async () => {
        const cookie = 'notion_glaze_id=u1';

        const prepareMock = vi.fn();
        mockDb.prepare = prepareMock;

        prepareMock.mockImplementation((query: string) => {
            if (query.includes('FROM users')) {
                return {
                    bind: vi.fn().mockReturnValue({
                        first: vi.fn().mockResolvedValue({ id: 'u1' })
                    })
                };
            }
            if (query.includes('INSERT INTO sessions')) {
                 return {
                    bind: vi.fn().mockReturnValue({
                        run: vi.fn().mockResolvedValue(undefined)
                    })
                };
            }
            return { bind: vi.fn() };
        });

        const result = await authService.recoverSession(cookie);
        expect(result).toBeDefined();
        expect(result!.userId).toBe('u1');
    });
});
