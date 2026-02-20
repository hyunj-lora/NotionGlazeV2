import { NotionGlazeBlock, NotionGlazeRichText } from "../types.js";

export class PublicNotionParser {
    /**
     * Parses a tree of blocks from a Notion recordMap into the NotionGlaze AST.
     */
    parseBlocks(blockIds: string[], payload: any): NotionGlazeBlock[] {
        const recordMap = payload.recordMap ? payload.recordMap : payload;

        if (!blockIds || !recordMap || !recordMap.block) {
            return [];
        }

        const parsedBlocks: NotionGlazeBlock[] = [];

        for (let i = 0; i < blockIds.length; i++) {
            let blockId = blockIds[i];

            // Ensure ID is hyphenated if recordMap requires it
            if (blockId.length === 32 && !blockId.includes('-')) {
                blockId = blockId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
            }

            let rawBlock = recordMap.block[blockId]?.value;
            if (!rawBlock) {
                // Try looking up the unhyphenated version just in case
                rawBlock = recordMap.block[blockId.replace(/-/g, '')]?.value;
            }

            if (rawBlock) {
                const parsedBlock = this.parseSingleBlock(rawBlock, payload);
                if (parsedBlock) {
                    parsedBlocks.push(parsedBlock);
                }
            }
        }

        return parsedBlocks;
    }

    private parseSingleBlock(rawBlock: any, recordMap: any): NotionGlazeBlock | null {
        const type = rawBlock.type;
        if (!type) return null;

        // Extract content based on the ORIGINAL notion type
        const extractedContent = this.extractContent(rawBlock);

        // Map Notion API types to NotionGlaze AST types
        let normalizedType = type;
        if (type === 'text') normalizedType = 'paragraph';
        if (type === 'header') normalizedType = 'heading_1';
        if (type === 'sub_header') normalizedType = 'heading_2';
        if (type === 'sub_sub_header') normalizedType = 'heading_3';
        if (type === 'page') normalizedType = 'child_page';
        if (type === 'bulleted_list') normalizedType = 'bulleted_list_item';
        if (type === 'numbered_list') normalizedType = 'numbered_list_item';

        const parsed: NotionGlazeBlock = {
            id: rawBlock.id,
            type: normalizedType,
            created_time: rawBlock.created_time || Date.now(),
            last_edited_time: rawBlock.last_edited_time || Date.now(),
            has_children: !!(rawBlock.content && rawBlock.content.length > 0),
            archived: rawBlock.alive === false,
            in_trash: false,
            content: extractedContent
        };


        if (rawBlock.content && rawBlock.content.length > 0) {
            const hyphenatedContentIds = rawBlock.content.map((id: string) => {
                if (id.length === 32 && !id.includes('-')) {
                    return id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
                }
                return id;
            });
            parsed.children = this.parseBlocks(hyphenatedContentIds, recordMap);
        }

        return parsed;
    }

    private extractContent(rawBlock: any): any {
        const type = rawBlock.type;
        const properties = rawBlock.properties || {};

        switch (type) {
            case 'text':
            case 'header':
            case 'sub_header':
            case 'sub_sub_header':
            case 'bulleted_list':
            case 'numbered_list':
            case 'to_do':
            case 'quote':
            case 'toggle':
                return {
                    rich_text: this.extractRichText(properties.title),
                    checked: properties.checked?.[0]?.[0] === 'Yes'
                };
            case 'image':
            case 'video':
            case 'file':
            case 'pdf':
                return {
                    // Public URLs often need special handling, but for now we extract the source
                    url: properties.source?.[0]?.[0],
                    caption: this.extractRichText(properties.caption),
                    type: properties.source?.[0]?.[0]?.startsWith('http') ? 'external' : 'file'
                };
            case 'code':
                return {
                    rich_text: this.extractRichText(properties.title),
                    language: properties.language?.[0]?.[0]?.toLowerCase()
                };
            case 'callout':
                return {
                    rich_text: this.extractRichText(properties.title),
                    icon: rawBlock.format?.page_icon
                };
            case 'bookmark':
                return {
                    url: properties.link?.[0]?.[0],
                    caption: this.extractRichText(properties.title)
                };
            case 'divider':
            case 'column_list':
            case 'column':
                return {};
            case 'page':
                return {
                    title: this.extractText(properties.title)
                };
            default:
                // For unknown types, attempt a generic text extraction
                return {
                    rich_text: this.extractRichText(properties.title)
                };
        }
    }

    /**
     * Extracts an array of rich text objects from a Notion recordMap property array.
     * Maps the proprietary formatting arrays (e.g. [['bold', 'italic']]) to
     * annotations ({ bold: true, italic: true }).
     */
    extractRichText(propertyArray: any[] | undefined): any[] {
        if (!propertyArray || !Array.isArray(propertyArray)) {
            return [];
        }

        return propertyArray.map(segment => {
            const text = segment[0];
            const formatArray = segment[1] || [];

            const annotations: any = {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default'
            };

            let href = null;

            for (const format of formatArray) {
                switch (format[0]) {
                    case 'b': annotations.bold = true; break;
                    case 'i': annotations.italic = true; break;
                    case 's': annotations.strikethrough = true; break;
                    case '_': annotations.underline = true; break;
                    case 'c': annotations.code = true; break;
                    case 'h': annotations.color = format[1]; break;
                    case 'a': href = format[1]; break;
                }
            }

            return {
                type: 'text',
                text: { content: text, link: href ? { url: href } : null },
                annotations,
                plain_text: text,
                href
            };
        });
    }

    /**
     * Extracts plain text from a Notion recordMap property array.
     * Often properties are an array of arrays like: [ [ "Text Content" ] ]
     */
    extractText(propertyArray: any[] | undefined): string {
        if (!propertyArray || !Array.isArray(propertyArray)) {
            return '';
        }

        let result = '';
        for (const segment of propertyArray) {
            if (Array.isArray(segment) && typeof segment[0] === 'string') {
                result += segment[0];
            }
        }
        return result.trim();
    }
}
