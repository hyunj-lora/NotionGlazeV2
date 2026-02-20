import { Client } from '@notionhq/client';
import type { SyncContext } from './types.js';

export class NotionService {
    public client: Client;

    constructor(accessToken: string) {
        this.client = new Client({ auth: accessToken });
    }

    /**
     * Fetches all pages from a database that have been edited since the last sync.
     */
    async getUpdatedPages(databaseId: string, sinceDate?: Date) {
        const filter: any = { and: [] };

        if (sinceDate) {
            filter.and.push({
                timestamp: "last_edited_time",
                last_edited_time: {
                    after: sinceDate.toISOString(),
                },
            });
        }

        const queryPayload: any = {
            database_id: databaseId,
            sorts: [
                {
                    timestamp: "last_edited_time",
                    direction: "descending",
                },
            ],
        };

        if (filter.and.length > 0) {
            queryPayload.filter = filter;
        }

        return await this.client.databases.query(queryPayload);
    }

    /**
     * Checks the single most recent change in the database. 
     * Returns the ISO string of the last_edited_time.
     */
    async getLatestDatabaseChangeTime(databaseId: string): Promise<string | null> {
        const response = await this.client.databases.query({
            database_id: databaseId,
            page_size: 1,
            sorts: [
                {
                    timestamp: "last_edited_time",
                    direction: "descending",
                },
            ],
        });

        if (response.results.length === 0) return null;
        return (response.results[0] as any).last_edited_time;
    }

    /**
     * Recursively fetches all blocks for a given page/block with a depth limit to avoid subrequest limits.
     */
    async getBlocks(blockId: string, depth = 0, context: SyncContext = { requestCount: 0 }): Promise<any[]> {
        // Safety: Max depth 3 for SaaS stability and subrequest limit
        if (depth > 3 || context.requestCount > 40) return [];

        let blocks: any[] = [];
        let cursor: string | undefined;

        try {
            while (true) {
                context.requestCount++;
                const response: any = await this.client.blocks.children.list({
                    block_id: blockId,
                    start_cursor: cursor,
                    page_size: 100
                });

                blocks.push(...response.results);

                if (!response.has_more || context.requestCount > 40) break;
                cursor = response.next_cursor;
            }

            // Fetch children only for critical blocks and within limits
            for (const block of blocks) {
                if (block.type === 'child_database') {
                    try {
                        // Parallel fetch for schema
                        const db = await this.client.databases.retrieve({ database_id: block.id });

                        // Recursive fetch for ALL rows
                        let allRows: any[] = [];
                        let cursor: string | undefined;

                        while (true) {
                            const response: any = await this.client.databases.query({
                                database_id: block.id,
                                page_size: 100,
                                start_cursor: cursor
                            });

                            allRows.push(...response.results);

                            if (!response.has_more || allRows.length >= 1000) break; // Hard limit 1000
                            cursor = response.next_cursor;
                        }

                        // Inject into block for Parser to pick up
                        (block as any).database_schema = (db as any).properties;
                        (block as any).database_rows = allRows;

                    } catch (e) {
                        console.error(`Failed to enrich database ${block.id}`, e);
                    }
                } else if (block.has_children && context.requestCount < 45) {
                    block.children = await this.getBlocks(block.id, depth + 1, context);
                }
            }
        } catch (err) {
            console.error(`Error fetching blocks for ${blockId}:`, err);
        }

        return blocks;
    }

    /**
     * Appends children blocks to a parent block.
     * Notion supports up to 100 blocks per request.
     */
    async appendBlockChildren(parentId: string, children: any[]) {
        return await this.client.blocks.children.append({
            block_id: parentId,
            children: children.map(block => {
                const { id, created_time, last_edited_time, has_children, archived, in_trash, parent, created_by, last_edited_by, ...cleanBlock } = block;
                return cleanBlock;
            })
        });
    }

    /**
     * Archives (deletes) a block.
     */
    async archiveBlock(blockId: string) {
        return await this.client.blocks.delete({
            block_id: blockId
        });
    }

    /**
     * Fetches metadata for a single page.
     */
    async getPage(pageId: string) {
        return await this.client.pages.retrieve({ page_id: pageId });
    }

    /**
     * Fetches metadata for a single database.
     */
    async getDatabase(databaseId: string) {
        return await this.client.databases.retrieve({ database_id: databaseId });
    }

    /**
     * Validates if the access token is still valid by making a lightweight API call.
     * Returns true if valid, false if invalid/expired.
     */
    async validateToken(): Promise<boolean> {
        try {
            // Use /v1/users/me endpoint - lightweight and requires valid token
            await this.client.users.me({});
            return true;
        } catch (error: any) {
            // Check if error is authentication-related
            if (error?.code === 'unauthorized' || error?.status === 401) {
                return false;
            }
            // For other errors (network, etc.), assume token is still valid
            console.warn('Token validation encountered non-auth error:', error?.message);
            return true;
        }
    }
}
