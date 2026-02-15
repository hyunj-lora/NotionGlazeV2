import { describe, it, expect, vi } from 'vitest';
import { recoverSessionFromCookie } from './lib/auth';

// Mock DB and Crypto if needed
const mockDb = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    run: vi.fn(),
};

describe('Silent Login Logic', () => {
    it('should recover session from notion_glaze_id cookie', async () => {
        // Mock user found in DB
        mockDb.first.mockResolvedValueOnce({ id: 'test-uuid' });

        const cookies = 'notion_glaze_id=test-uuid';
        const userId = await recoverSessionFromCookie(cookies, mockDb as any);

        expect(userId).toBe('test-uuid');
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM users'));
    });

    it('should return null if notion_glaze_id is missing', async () => {
        const cookies = 'other_cookie=value';
        const userId = await recoverSessionFromCookie(cookies, mockDb as any);
        expect(userId).toBe(null);
    });
});
