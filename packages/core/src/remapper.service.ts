import { NotionService } from './notion.js';
import { calculateBlockContentHash, generateRemapMap, BlockSnapshot } from './reconciler.js';

export class RemapperService {
    constructor(private notion: NotionService) { }

    /**
     * Executes the full move-remap sequence.
     * 1. Fetches source children snapshots.
     * 2. Appends children to target parent.
     * 3. Generates ID Mapping table.
     * 4. Archives source.
     */
    async moveBlockAndRemap(
        sourceId: string,
        targetParentId: string
    ): Promise<{ idMap: Record<string, string> }> {
        // Step 1: Fetch source block children to clone
        const children = await this.notion.getBlocks(sourceId);

        // Take snapshots for reconciliation (Hashing)
        const snapshots: BlockSnapshot[] = children.map(block => ({
            id: block.id,
            type: block.type,
            contentHash: calculateBlockContentHash(block)
        }));

        // Step 2: Append children to target
        // Note: Notion returns the new blocks in the same order
        const response: any = await this.notion.appendBlockChildren(targetParentId, children);
        const newBlocks = response.results;

        // Step 3: Generate the ID Remap Map (Tree-Zip)
        const remapMap = generateRemapMap(snapshots, newBlocks);

        // Add the sourceId -> targetId mapping itself
        // (Notion doesn't return the parent container in results of append, 
        // but if we were copying the source block itself, we'd handle it here)
        // In this case, sourceId is usually the item being moved.

        // Step 4: Archive source block
        await this.notion.archiveBlock(sourceId);

        // Convert Map to Record for JSON serialization
        const idMap: Record<string, string> = {};
        remapMap.forEach((newId, oldId) => {
            idMap[oldId] = newId;
        });

        return { idMap };
    }
}
