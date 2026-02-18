import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service.js';

const mockDb = {
    prepare: vi.fn(),
};

describe('UserService', () => {
    let userService: UserService;

    beforeEach(() => {
        userService = new UserService(mockDb as any);
        vi.clearAllMocks();
    });

    it('should find user by notion id', async () => {
        const mockUser = { id: 'u1', notion_user_id: 'n1' };
        mockDb.prepare.mockReturnValue({
            bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(mockUser)
            })
        });

        const user = await userService.getUserByNotionId('n1');
        expect(user).toEqual(mockUser);
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users WHERE notion_user_id = ?'));
    });

    it('should find user by id', async () => {
        const mockUser = { id: 'u1', notion_user_id: 'n1' };
        mockDb.prepare.mockReturnValue({
            bind: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(mockUser)
            })
        });

        const user = await userService.getUserById('u1');
        expect(user).toEqual(mockUser);
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users WHERE id = ?'));
    });

    it('should create user', async () => {
        const newUser = { id: 'u2', notion_user_id: 'n2', email: 'test@example.com' };
        mockDb.prepare.mockReturnValue({
            bind: vi.fn().mockReturnValue({
                run: vi.fn().mockResolvedValue(undefined)
            })
        });

        await userService.createUser(newUser);
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'));
    });

    it('should update user', async () => {
        const updates = { email: 'updated@example.com' };
        mockDb.prepare.mockReturnValue({
            bind: vi.fn().mockReturnValue({
                run: vi.fn().mockResolvedValue(undefined)
            })
        });

        await userService.updateUser('u1', updates);
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'));
    });
});
