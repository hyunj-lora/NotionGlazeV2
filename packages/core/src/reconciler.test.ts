import { describe, it, expect } from 'vitest';
import { calculateBlockContentHash, generateRemapMap, BlockSnapshot } from './reconciler.js';

describe('Reconciler Logic', () => {
    const mockBlock = {
        type: 'paragraph',
        paragraph: {
            rich_text: [{ plain_text: 'Hello World' }]
        }
    };

    it('should generate a deterministic hash for a block', () => {
        const hash1 = calculateBlockContentHash(mockBlock);
        const hash2 = calculateBlockContentHash({ ...mockBlock });

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(32); // MD5 hex length
    });

    it('should generate different hashes for different content', () => {
        const hash1 = calculateBlockContentHash(mockBlock);
        const hash2 = calculateBlockContentHash({
            type: 'paragraph',
            paragraph: { rich_text: [{ plain_text: 'Different' }] }
        });

        expect(hash1).not.toBe(hash2);
    });

    it('should correctly map old IDs to new IDs using Tree-Zip', () => {
        const oldSnapshot: BlockSnapshot[] = [
            { id: 'old-1', type: 'paragraph', contentHash: calculateBlockContentHash(mockBlock) },
            { id: 'old-2', type: 'image', contentHash: 'hash-image' }
        ];

        const newBlocks = [
            { id: 'new-1', type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Hello World' }] } },
            { id: 'new-2', type: 'image', image: { type: 'external', external: { url: 'test.png' } } }
        ];

        // Hack for testing: set the hash of the image block manually in test or use real hashing
        const remapMap = generateRemapMap(oldSnapshot, newBlocks);

        expect(remapMap.get('old-1')).toBe('new-1');
        expect(remapMap.get('old-2')).toBe('new-2');
    });

    it('should throw an error if tree sizes mismatch', () => {
        const oldSnapshot: BlockSnapshot[] = [{ id: 'old-1', type: 'paragraph', contentHash: 'h' }];
        const newBlocks = [{}, {}]; // 2 blocks instead of 1

        expect(() => generateRemapMap(oldSnapshot, newBlocks)).toThrow('Tree mismatch');
    });
});
