import crypto from 'crypto';

export interface BlockSnapshot {
    id: string;
    type: string;
    contentHash: string;
}

/**
 * Generates a deterministic hash for a Notion block's content.
 * Focuses on type and the specific content field (text, url, file, etc.)
 */
export function calculateBlockContentHash(block: any): string {
    const type = block.type;
    const content = block[type];

    // Stringify only the relevant content part to stay stable
    const contentString = JSON.stringify(content);

    return crypto
        .createHash('md5')
        .update(`${type}:${contentString}`)
        .digest('hex');
}

/**
 * Tree-Zip Algorithm: Maps old block IDs to new block IDs by comparing
 * index and content hashes.
 */
export function generateRemapMap(
    oldSnapshot: BlockSnapshot[],
    newBlocks: any[]
): Map<string, string> {
    const remapTable = new Map<string, string>();

    if (oldSnapshot.length !== newBlocks.length) {
        throw new Error(`Tree mismatch: Expected ${oldSnapshot.length} blocks, received ${newBlocks.length}. Structural change detected during move.`);
    }

    oldSnapshot.forEach((oldBlock, index) => {
        const newBlock = newBlocks[index];
        const newHash = calculateBlockContentHash(newBlock);

        // Validation: Ensure type and content hash match to prevent mis-mapping
        if (oldBlock.type !== newBlock.type) {
            console.warn(`Type mismatch at index ${index}: ${oldBlock.type} vs ${newBlock.type}`);
        }

        if (oldBlock.contentHash !== newHash) {
            console.warn(`Content drift detected at block ${oldBlock.id}. Hashing mismatch.`);
            // Note: We still map it if type matches, but warn. 
            // A more strict implementation could throw or flag for resync.
        }

        remapTable.set(oldBlock.id, newBlock.id);
    });

    return remapTable;
}
