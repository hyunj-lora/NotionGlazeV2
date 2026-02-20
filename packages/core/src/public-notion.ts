import type { SyncContext } from './types.js';

export class PublicNotionService {
    // Unofficial Notion API base for fetching public pages
    // See: https://github.com/NotionX/react-notion-x/tree/master/packages/notion-client
    private apiBase = 'https://www.notion.so/api/v3';

    constructor() { }

    /**
     * Extracts the 32-character Notion block ID from a typical public URL.
     * Handles URLs like:
     * - https://notion.so/My-Page-Title-1234567890abcdef1234567890abcdef
     * - https://workspace.notion.site/1234567890abcdef1234567890abcdef
     */
    extractBlockIdFromUrl(url: string): string | null {
        try {
            const parsed = new URL(url);
            const pathParts = parsed.pathname.split('/').filter(p => p.length > 0);

            if (pathParts.length === 0) return null;

            const lastPart = pathParts[pathParts.length - 1];

            // Notion IDs are 32 hex chars. Often formatted as 8-4-4-4-12 or completely un-dashed.
            // On public URLs, they are usually at the very end of the slug, un-dashed.
            const match = lastPart.match(/([a-f0-9]{32})$/i);

            if (match && match[1]) {
                return match[1];
            }

            // If it's pure UUID format
            const uuidMatch = lastPart.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
            if (uuidMatch && uuidMatch[1]) {
                return uuidMatch[1].replace(/-/g, '');
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Formats a raw 32 char hex string into a standard UUID format (8-4-4-4-12).
     * The unofficial API requires properly dashed UUIDs for block lookups.
     */
    formatUUID(id: string): string {
        if (id.includes('-')) return id;
        if (id.length !== 32) return id;
        return `${id.substr(0, 8)}-${id.substr(8, 4)}-${id.substr(12, 4)}-${id.substr(16, 4)}-${id.substr(20, 12)}`;
    }

    /**
     * Loads a page's record map. This fetches blocks, collections, and spaces.
     */
    async getPageRecordMap(pageId: string) {
        const formattedId = this.formatUUID(pageId);

        const response = await fetch(`${this.apiBase}/loadPageChunk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pageId: formattedId,
                limit: 100, // May need pagination handling if pages get huge
                cursor: { stack: [] },
                chunkNumber: 0,
                verticalColumns: false
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to load Notion public page: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Looks for child sub-pages within a loaded chunk and attempts to extract
     * standard post metadata from properties. Since it's unstructured, we rely on
     * conventional property names (if it's a collection) or just titles.
     */
    extractPostsFromRecordMap(recordMap: any, parentId: string): any[] {
        const posts: any[] = [];
        const blocks = recordMap.recordMap?.block || {};

        // Find the parent block
        const parentBlockRaw = blocks[parentId]?.value;
        if (!parentBlockRaw) return [];

        // If the parent is a collection view (database), fetch the collection
        if (parentBlockRaw.type === 'collection_view' || parentBlockRaw.type === 'collection_view_page') {
            const collectionId = parentBlockRaw.collection_id;
            const collection = recordMap.recordMap?.collection?.[collectionId]?.value;

            if (collection && collection.schema) {
                // Here we would iterate through sub-pages mapping schema properties
                // This is a complex logic that the worker will need to adapt to.
                // For Phase 2, let's keep it simple and just return the raw collection data so the worker can parse it.
                return [{ type: 'collection', data: collection, rawBlocks: blocks }];
            }
        }

        return posts;
    }
}
