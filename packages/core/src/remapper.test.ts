import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemapperService } from './remapper.service.js';
import { NotionService } from './notion.js';

// Simple Mock for NotionService
class MockNotionService {
    getBlocks = vi.fn();
    appendBlockChildren = vi.fn();
    archiveBlock = vi.fn();
}

describe('RemapperService Orchestration', () => {
    let mockNotion: MockNotionService;
    let remapper: RemapperService;

    beforeEach(() => {
        mockNotion = new MockNotionService();
        remapper = new RemapperService(mockNotion as any);
    });

    it('should coordinate the full move and remap sequence', async () => {
        const sourceId = 'src-id';
        const targetParentId = 'target-parent';

        // Setup Mocks
        const mockChildren = [
            { id: 'b1', type: 'paragraph', paragraph: { rich_text: [] } }
        ];
        mockNotion.getBlocks.mockResolvedValue(mockChildren);

        mockNotion.appendBlockChildren.mockResolvedValue({
            results: [{ id: 'new-b1', type: 'paragraph' }]
        });

        mockNotion.archiveBlock.mockResolvedValue({});

        // Execute
        const result = await remapper.moveBlockAndRemap(sourceId, targetParentId);

        // Verify Sequence
        expect(mockNotion.getBlocks).toHaveBeenCalledWith(sourceId);
        expect(mockNotion.appendBlockChildren).toHaveBeenCalledWith(targetParentId, mockChildren);
        expect(mockNotion.archiveBlock).toHaveBeenCalledWith(sourceId);

        // Verify Mapping Result
        expect(result.idMap).toEqual({ 'b1': 'new-b1' });
    });

    it('should propagate errors if Notion append fails', async () => {
        mockNotion.getBlocks.mockResolvedValue([]);
        mockNotion.appendBlockChildren.mockRejectedValue(new Error('Notion API Error'));

        await expect(remapper.moveBlockAndRemap('s', 't')).rejects.toThrow('Notion API Error');
    });
});
