
import { describe, it, expect } from 'vitest';
import { NotionParser } from './parser.js';

describe('NotionParser', () => {
    it('should enrich child_database blocks with schema, rows, and parse Magic Tags', () => {
        const mockDatabaseBlock = {
            id: 'db-123',
            type: 'child_database',
            child_database: { title: 'Test Database [Gallery] [Masonry]' },
            // Enriched data
            database_schema: {
                "Title": { type: "title", name: "Name" },
                "Status": {
                    type: "select",
                    name: "Status",
                    options: [{ name: "Done", color: "green" }]
                }
            },
            database_rows: [
                {
                    id: 'page-1',
                    url: 'https://notion.so/page-1',
                    icon: { type: "emoji", emoji: "🚀" },
                    cover: null,
                    properties: {
                        "Name": { type: "title", title: [{ plain_text: "Task 1" }] },
                        "Status": { type: "select", select: { name: "Done", color: "green" } }
                    }
                }
            ]
        };

        const parsed = NotionParser.parseBlocks([mockDatabaseBlock]);
        const dbContent = parsed[0].content;

        // Metadata Parsing
        expect(dbContent.title).toBe('Test Database'); // Sanitized
        expect(dbContent.viewType).toBe('gallery');
        expect(dbContent.layoutFlags).toContain('Masonry');

        // Schema & Row Parsing
        expect(dbContent.rows).toHaveLength(1);
        expect(dbContent.rows[0].properties["Name"]).toBe("Task 1");
        expect(dbContent.rows[0].properties["Status"].name).toBe("Done");
    });

    it('should parse SEO-related properties correctly (checkbox, url)', () => {
        const mockBlock = {
            id: 'db-seo',
            type: 'child_database',
            child_database: { title: 'SEO Test' },
            database_schema: {
                "Noindex": { type: "checkbox", name: "Noindex" },
                "Canonical": { type: "url", name: "Canonical" }
            },
            database_rows: [
                {
                    id: 'page-seo',
                    properties: {
                        "Noindex": { type: "checkbox", checkbox: true },
                        "Canonical": { type: "url", url: "https://example.com/canonical" }
                    }
                }
            ]
        };

        const parsed = NotionParser.parseBlocks([mockBlock]);
        const props = parsed[0].content.rows[0].properties;

        expect(props["Noindex"]).toBe(true);
        expect(props["Canonical"]).toBe("https://example.com/canonical");
    });

    it('should prioritize View Type correctly (Calendar > Gallery)', () => {
        const mockBlock = {
            id: 'db-456',
            type: 'child_database',
            child_database: { title: 'My Calendar [Gallery] [Calendar]' }, // Conflict
            database_schema: {},
            database_rows: []
        };
        const parsed = NotionParser.parseBlocks([mockBlock]);
        expect(parsed[0].content.viewType).toBe('calendar');
    });
});
