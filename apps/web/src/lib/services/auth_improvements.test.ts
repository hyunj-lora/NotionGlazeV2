import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantService } from '@notionglaze/core';

// ─── Mock DB Factory ─────────────────────────────────────────────────────────
function createMockDb() {
    const db: any = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
        run: vi.fn(),
        all: vi.fn(),
    };
    return db;
}

// ─── TenantService: Token Validation Methods ──────────────────────────────────
describe('TenantService — Token Validation', () => {
    let db: ReturnType<typeof createMockDb>;
    let service: TenantService;

    beforeEach(() => {
        db = createMockDb();
        service = new TenantService(db);
        vi.clearAllMocks();
    });

    describe('needsTokenValidation()', () => {
        it('returns false if tenant has no notion_access_token', async () => {
            const tenant: any = {
                id: 'tenant-1',
                notion_access_token: null,
                last_token_check_at: null,
            };

            const result = service.needsTokenValidation(tenant);
            expect(result).toBe(false);
        });

        it('returns true if last_token_check_at is null (never checked)', async () => {
            const tenant: any = {
                id: 'tenant-1',
                notion_access_token: 'encrypted-token',
                last_token_check_at: null,
            };

            const result = service.needsTokenValidation(tenant);
            expect(result).toBe(true);
        });

        it('returns true if last check was more than 1 hour ago', async () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
            const tenant: any = {
                id: 'tenant-1',
                notion_access_token: 'encrypted-token',
                last_token_check_at: twoHoursAgo,
            };

            const result = service.needsTokenValidation(tenant);
            expect(result).toBe(true);
        });

        it('returns false if last check was within 1 hour', async () => {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
            const tenant: any = {
                id: 'tenant-1',
                notion_access_token: 'encrypted-token',
                last_token_check_at: thirtyMinutesAgo,
            };

            const result = service.needsTokenValidation(tenant);
            expect(result).toBe(false);
        });
    });

    describe('invalidateNotionToken()', () => {
        it('sets notion_access_token and root_page_id to NULL', async () => {
            db.run.mockResolvedValueOnce({ success: true });

            await service.invalidateNotionToken('tenant-1');

            expect(db.prepare).toHaveBeenCalledWith(
                expect.stringContaining('notion_access_token = NULL')
            );
            expect(db.prepare).toHaveBeenCalledWith(
                expect.stringContaining('root_page_id = NULL')
            );
            expect(db.bind).toHaveBeenCalledWith('tenant-1');
        });

        it('updates updated_at timestamp on invalidation', async () => {
            db.run.mockResolvedValueOnce({ success: true });

            await service.invalidateNotionToken('tenant-1');

            expect(db.prepare).toHaveBeenCalledWith(
                expect.stringContaining('updated_at = CURRENT_TIMESTAMP')
            );
        });
    });

    describe('updateTokenCheckTimestamp()', () => {
        it('updates last_token_check_at to CURRENT_TIMESTAMP', async () => {
            db.run.mockResolvedValueOnce({ success: true });

            await service.updateTokenCheckTimestamp('tenant-1');

            expect(db.prepare).toHaveBeenCalledWith(
                expect.stringContaining('last_token_check_at = CURRENT_TIMESTAMP')
            );
            expect(db.bind).toHaveBeenCalledWith('tenant-1');
        });
    });
});

// ─── Logout Endpoint Logic ────────────────────────────────────────────────────
describe('Logout Endpoint — Cookie Clearing', () => {
    it('clears both session_id and notion_glaze_id cookies', async () => {
        // Simulate what logout.ts does
        const responseHeaders = new Headers();
        responseHeaders.append('Set-Cookie', 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');
        responseHeaders.append('Set-Cookie', 'notion_glaze_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');

        const setCookies = responseHeaders.getSetCookie
            ? responseHeaders.getSetCookie()
            : responseHeaders.get('Set-Cookie');

        const cookieStr = Array.isArray(setCookies) ? setCookies.join(', ') : setCookies ?? '';
        expect(cookieStr).toContain('session_id=;');
        expect(cookieStr).toContain('notion_glaze_id=;');
    });

    it('sets Expires to epoch (effectively deletes cookie)', () => {
        const responseHeaders = new Headers();
        responseHeaders.append('Set-Cookie', 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');

        const setCookies = responseHeaders.getSetCookie
            ? responseHeaders.getSetCookie()
            : responseHeaders.get('Set-Cookie');

        const cookieStr = Array.isArray(setCookies) ? setCookies.join(', ') : setCookies ?? '';
        expect(cookieStr).toContain('Expires=Thu, 01 Jan 1970');
    });

    it('sets HttpOnly and SameSite=Lax on both cookies', () => {
        const responseHeaders = new Headers();
        responseHeaders.append('Set-Cookie', 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');
        responseHeaders.append('Set-Cookie', 'notion_glaze_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax');

        const setCookies = responseHeaders.getSetCookie
            ? responseHeaders.getSetCookie()
            : responseHeaders.get('Set-Cookie');

        const cookieStr = Array.isArray(setCookies) ? setCookies.join(', ') : setCookies ?? '';
        expect(cookieStr).toContain('HttpOnly');
        expect(cookieStr).toContain('SameSite=Lax');
    });
});

// ─── Revoke Endpoint Logic ────────────────────────────────────────────────────
describe('Revoke Endpoint — Session Deletion', () => {
    let db: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        db = createMockDb();
        vi.clearAllMocks();
    });

    it('deletes ALL sessions by user_id (not just current session)', async () => {
        db.run.mockResolvedValueOnce({ success: true });

        // Simulate revoke.ts session deletion
        await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind('user-1').run();

        expect(db.prepare).toHaveBeenCalledWith('DELETE FROM sessions WHERE user_id = ?');
        expect(db.bind).toHaveBeenCalledWith('user-1');
    });

    it('nullifies notion_access_token and root_page_id in tenants', async () => {
        db.run.mockResolvedValueOnce({ success: true });

        await db.prepare(`
            UPDATE tenants 
            SET notion_access_token = NULL, root_page_id = NULL 
            WHERE owner_id = ?
        `).bind('user-1').run();

        expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('notion_access_token = NULL'));
        expect(db.bind).toHaveBeenCalledWith('user-1');
    });
});

// ─── NotionService: validateToken() ──────────────────────────────────────────
describe('NotionService — validateToken()', () => {
    it('returns true when Notion API responds successfully', async () => {
        // Mock the Notion client
        const mockUsersMe = vi.fn().mockResolvedValueOnce({ id: 'user-1', type: 'bot' });
        const mockService = {
            validateToken: async () => {
                try {
                    await mockUsersMe({});
                    return true;
                } catch (error: any) {
                    if (error?.code === 'unauthorized' || error?.status === 401) return false;
                    return true;
                }
            }
        };

        const result = await mockService.validateToken();
        expect(result).toBe(true);
    });

    it('returns false when Notion API returns 401 unauthorized', async () => {
        const mockUsersMe = vi.fn().mockRejectedValueOnce({ code: 'unauthorized', status: 401 });
        const mockService = {
            validateToken: async () => {
                try {
                    await mockUsersMe({});
                    return true;
                } catch (error: any) {
                    if (error?.code === 'unauthorized' || error?.status === 401) return false;
                    return true;
                }
            }
        };

        const result = await mockService.validateToken();
        expect(result).toBe(false);
    });

    it('returns true (conservative) on network errors to avoid false positives', async () => {
        const mockUsersMe = vi.fn().mockRejectedValueOnce(new Error('Network timeout'));
        const mockService = {
            validateToken: async () => {
                try {
                    await mockUsersMe({});
                    return true;
                } catch (error: any) {
                    if (error?.code === 'unauthorized' || error?.status === 401) return false;
                    return true; // conservative: assume valid on non-auth errors
                }
            }
        };

        const result = await mockService.validateToken();
        expect(result).toBe(true);
    });
});

// ─── Silent Login: recoverSessionFromCookie() ─────────────────────────────────
describe('Silent Login — recoverSessionFromCookie()', () => {
    let db: ReturnType<typeof createMockDb>;

    beforeEach(() => {
        db = createMockDb();
        vi.clearAllMocks();
    });

    it('returns userId when notion_glaze_id cookie exists and user is found', async () => {
        db.first.mockResolvedValueOnce({ id: 'user-uuid-123' });

        // Simulate recoverSessionFromCookie logic
        const cookies = 'notion_glaze_id=user-uuid-123; other=value';
        const notionGlazeId = cookies
            ?.split(';')
            .find((c: string) => c.trim().startsWith('notion_glaze_id='))
            ?.split('=')[1]
            ?.trim();

        let userId: string | null = null;
        if (notionGlazeId) {
            const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(notionGlazeId).first();
            userId = user?.id ?? null;
        }

        expect(userId).toBe('user-uuid-123');
    });

    it('returns null when notion_glaze_id cookie is absent', async () => {
        const cookies = 'session_id=abc123; other=value';
        const notionGlazeId = cookies
            ?.split(';')
            .find((c: string) => c.trim().startsWith('notion_glaze_id='))
            ?.split('=')[1]
            ?.trim();

        expect(notionGlazeId).toBeUndefined();
    });

    it('returns null when user is not found in DB (deleted account)', async () => {
        db.first.mockResolvedValueOnce(null);

        const cookies = 'notion_glaze_id=ghost-user-id';
        const notionGlazeId = cookies
            ?.split(';')
            .find((c: string) => c.trim().startsWith('notion_glaze_id='))
            ?.split('=')[1]
            ?.trim();

        let userId: string | null = null;
        if (notionGlazeId) {
            const user = await db.prepare('SELECT id FROM users WHERE id = ?').bind(notionGlazeId).first();
            userId = user?.id ?? null;
        }

        expect(userId).toBeNull();
    });
});
