import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostService } from './post';

describe('PostService', () => {
    let mockDb: any;
    let service: PostService;

    beforeEach(() => {
        mockDb = {
            prepare: vi.fn().mockReturnThis(),
            bind: vi.fn().mockReturnThis(),
            all: vi.fn(),
            first: vi.fn()
        };
        service = new PostService(mockDb);
    });

    it('should return feed type if home_page_id is missing', async () => {
        mockDb.all.mockResolvedValue({ results: [{ id: '1', title: 'Post 1', tags: '[]' }] });

        const result = await service.resolveHomeData('tenant-1', {});

        expect(result.type).toBe('feed');
        expect(result.posts).toHaveLength(1);
        expect(result.posts?.[0].title).toBe('Post 1');
    });

    it('should return page type if home_page_id is valid', async () => {
        const mockPost = { id: 'page-123', title: 'Home', content_json: '[]', tags: '[]' };
        mockDb.first.mockResolvedValue(mockPost);
        mockDb.all.mockResolvedValue({ results: [{ id: 'page-123', slug: 'home' }] });

        const result = await service.resolveHomeData('tenant-1', { home_page_id: 'page-123' });

        expect(result.type).toBe('page');
        expect(result.post.id).toBe('page-123');
        expect(result.idToSlugMap).toBeDefined();
        expect(result.idToSlugMap?.['page123']).toBe('home');
    });

    it('should fallback to feed if home_page_id post is not found', async () => {
        mockDb.first.mockResolvedValue(null);
        mockDb.all.mockResolvedValue({ results: [] });

        const result = await service.resolveHomeData('tenant-1', { home_page_id: 'missing-id' });

        expect(result.type).toBe('feed');
        expect(result.posts).toHaveLength(0);
    });

    it('should fetch all simple posts', async () => {
        mockDb.all.mockResolvedValue({ results: [{ id: '1', title: 'A' }, { id: '2', title: 'B' }] });

        const result = await service.getPostsSimple('tenant-1');

        expect(result).toHaveLength(2);
        expect(result[0].title).toBe('A');
    });
});
