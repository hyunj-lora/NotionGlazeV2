import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from './useStudioStore';

describe('useStudioStore - Stable Identity', () => {
    beforeEach(() => {
        useStudioStore.getState().resetStore();
    });

    it('should initialize blocks with stable v_ids if missing', () => {
        const mockBlocks = [
            { id: 'notion-1', type: 'paragraph', paragraph: { rich_text: [] } },
            { id: 'notion-2', type: 'image', image: { type: 'external', external: { url: '' } } }
        ];

        const { setBlocks, blocks } = useStudioStore.getState();
        setBlocks(mockBlocks as any);

        const updatedBlocks = useStudioStore.getState().blocks;

        expect(updatedBlocks).toHaveLength(2);
        expect(updatedBlocks[0].v_id).toBeDefined();
        expect(updatedBlocks[1].v_id).toBeDefined();
        expect(updatedBlocks[0].n_id).toBe('notion-1');
        expect(updatedBlocks[1].v_id).not.toBe(updatedBlocks[0].v_id);
    });

    it('should maintain v_id even if n_id is updated during reconciliation', () => {
        const initialBlocks = [
            { id: 'notion-1', type: 'paragraph', v_id: 'stable-v-1' }
        ];

        const { setBlocks } = useStudioStore.getState();
        setBlocks(initialBlocks as any);

        const { reconcileIds } = useStudioStore.getState();
        reconcileIds({ 'notion-1': 'new-notion-id' });

        const updatedBlocks = useStudioStore.getState().blocks;
        expect(updatedBlocks[0].n_id).toBe('new-notion-id');
        expect(updatedBlocks[0].v_id).toBe('stable-v-1'); // Stable!
    });

    it('should move blocks optimistically', () => {
        const initialBlocks = [
            { id: '1', v_id: 'v1', type: 'p' },
            { id: '2', v_id: 'v2', type: 'p' },
            { id: '3', v_id: 'v3', type: 'p' }
        ];
        useStudioStore.getState().setBlocks(initialBlocks);

        // Move v1 to index 2 (end)
        useStudioStore.getState().moveBlock('v1', 2);

        const blocks = useStudioStore.getState().blocks;
        expect(blocks[0].v_id).toBe('v2');
        expect(blocks[1].v_id).toBe('v3');
        expect(blocks[2].v_id).toBe('v1');
        expect(blocks[2].isSyncing).toBe(true);

        const pending = useStudioStore.getState().pendingOperations;
        expect(pending).toHaveLength(1);
        expect(pending[0].v_id).toBe('v1');
    });

    it('should accumulate multiple moves in pendingOperations', () => {
        const initialBlocks = [
            { id: '1', v_id: 'v1', type: 'p' },
            { id: '2', v_id: 'v2', type: 'p' }
        ];
        useStudioStore.getState().setBlocks(initialBlocks);

        useStudioStore.getState().moveBlock('v1', 1);
        useStudioStore.getState().moveBlock('v2', 0);

        const pending = useStudioStore.getState().pendingOperations;
        expect(pending).toHaveLength(2);
        expect(pending[0].v_id).toBe('v1');
        expect(pending[1].v_id).toBe('v2');
    });

    it('should reconcile multiple IDs and clear syncing flags', () => {
        const initialBlocks = [
            { id: 'old-1', v_id: 'v1', type: 'p', isSyncing: true },
            { id: 'old-2', v_id: 'v2', type: 'p', isSyncing: true }
        ];
        useStudioStore.getState().setBlocks(initialBlocks);

        useStudioStore.getState().reconcileIds({
            'old-1': 'new-1',
            'old-2': 'new-2'
        });

        const blocks = useStudioStore.getState().blocks;
        expect(blocks[0].n_id).toBe('new-1');
        expect(blocks[1].n_id).toBe('new-2');
        expect(blocks[0].isSyncing).toBe(false);
        expect(blocks[1].isSyncing).toBe(false);
    });
});
