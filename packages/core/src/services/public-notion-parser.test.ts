import { PublicNotionParser } from './public-notion-parser.js';
import * as fs from 'fs';
import { resolve } from 'path';
import { describe, it, expect, beforeAll } from 'vitest';

describe('PublicNotionParser', () => {
    let parser: PublicNotionParser;
    let recordMap: any;
    let rootBlockId = 'bd685b91-8f23-4c65-a226-cf4ccf698af9'; // The ID from the user's dump

    beforeAll(() => {
        parser = new PublicNotionParser();
        const dumpPath = resolve(__dirname, '../../../../scripts/recordMap_dump.json');
        try {
            const rawData = fs.readFileSync(dumpPath, 'utf8');
            recordMap = JSON.parse(rawData);
        } catch (e) {
            console.warn('Skipping full tests: recordMap_dump.json not found locally.');
        }
    });

    it('should initialize', () => {
        expect(parser).toBeDefined();
    });

    it('should extract text content from a block', () => {
        if (!recordMap) return;

        // Find a known text block in the dump to test against
        // Just checking root properties for now as it's the title
        const rootBlock = recordMap.recordMap.block[rootBlockId]?.value;
        expect(rootBlock).toBeDefined();

        const text = parser.extractText(rootBlock.properties?.title);
        expect(text).toBe('HUMANERD - Landing Page');
    });

    it('should recursively parse a block tree', () => {
        if (!recordMap) return;

        const rootBlock = recordMap.recordMap.block[rootBlockId]?.value;
        expect(rootBlock.content.length).toBeGreaterThan(0);

        // We pass the root block's children to parseBlocks, simulating what Sync Worker will do
        const parsedTree = parser.parseBlocks(rootBlock.content, recordMap);

        expect(parsedTree.length).toBe(rootBlock.content.length);

        // Verify the structure of the first parsed block
        const firstBlock = parsedTree[0];
        expect(firstBlock.id).toBeDefined();
        expect(firstBlock.type).toBeDefined();
        expect(firstBlock.content).toBeDefined();

        // Basic check for rich_text mapping if it's a text-based block
        if (firstBlock.content.rich_text) {
            expect(Array.isArray(firstBlock.content.rich_text)).toBe(true);
        }
    });
});
