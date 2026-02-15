export class NotionParser {
    /**
     * Converts Notion blocks to a clean, optimized JSON structure
     * suitable for Astro rendering.
     */
    static parseBlocks(blocks: any[]): any[] {
        return blocks.map(block => {
            const parsed: any = {
                id: block.id,
                type: block.type,
                created_time: new Date(block.created_time).getTime(),
                last_edited_time: new Date(block.last_edited_time).getTime(),
                has_children: block.has_children,
                archived: block.archived || false,
                in_trash: block.in_trash || false,
                content: this.extractContent(block)
            };

            if (block.children) {
                parsed.children = this.parseBlocks(block.children);
            }

            return parsed;
        });
    }

    private static extractContent(block: any): any {
        const type = block.type;
        const data = block[type];

        switch (type) {
            case 'paragraph':
            case 'heading_1':
            case 'heading_2':
            case 'heading_3':
            case 'bulleted_list_item':
            case 'numbered_list_item':
            case 'to_do':
            case 'quote':
            case 'toggle':
                return {
                    rich_text: data.rich_text,
                    checked: data.checked // For to_do
                };
            case 'image':
            case 'video':
            case 'file':
            case 'pdf':
                return {
                    url: data.file?.url || data.external?.url,
                    caption: data.caption,
                    type: data.type // 'file' or 'external'
                };
            case 'code':
                return {
                    rich_text: data.rich_text,
                    language: data.language
                };
            case 'callout':
                return {
                    rich_text: data.rich_text,
                    icon: data.icon
                };
            case 'button':
                return {
                    rich_text: data.rich_text,
                    outline: data.outline,
                    color: data.color
                };
            case 'bookmark':
                return {
                    url: data.url,
                    caption: data.caption
                };
            case 'child_database':
                const metadata = this.parseDatabaseMetadata(data);
                return {
                    title: metadata.title,
                    original_title: data.title,
                    viewType: metadata.viewType,
                    layoutFlags: metadata.layoutFlags,
                    // If the backend has injected `database_schema` and `database_rows` (Enrichment Strategy)
                    schema: block.database_schema,
                    rows: block.database_rows ? block.database_rows.map((row: any) => ({
                        id: row.id,
                        icon: row.icon?.emoji || row.icon?.external?.url || row.icon?.file?.url || null,
                        cover: row.cover?.external?.url || row.cover?.file?.url || null,
                        created_time: new Date(row.created_time).getTime(),
                        last_edited_time: new Date(row.last_edited_time).getTime(),
                        properties: this.parseDatabaseProperties(row.properties, block.database_schema),
                        url: row.url
                    })) : []
                };
            case 'equation':
                return {
                    expression: data.expression
                };
            case 'divider':
            case 'column_list':
            case 'column':
            case 'synced_block':
                return {};
            case 'table':
                return {
                    table_width: data.table_width,
                    has_column_header: data.has_column_header,
                    has_row_header: data.has_row_header
                };
            case 'table_row':
                return {
                    cells: data.cells // This is an array of rich_text arrays
                };
            default:
                // Return raw data if not explicitly handled
                return data;
        }
    }

    private static parseDatabaseMetadata(data: any): { title: string, viewType: string, layoutFlags: string[] } {
        const title = data.title || "";
        const description = data.description || "";

        const knownTags = ['Gallery', 'Masonry', 'Board', 'List', 'Hero', 'Calendar', 'Timeline', 'Feed', 'Kanban', 'Table'];
        const pattern = new RegExp(`\\[(${knownTags.join('|')})\\]`, 'gi');

        const extract = (text: string) => {
            const matches = text.match(pattern);
            return matches ? matches.map(m => m.replace(/[\[\]]/g, '')) : [];
        };

        const magicTags = extract(description).length > 0 ? extract(description) : extract(title);
        const lowerTags = magicTags.map(t => t.toLowerCase());

        const viewTypeMap: Record<string, string> = {
            calendar: 'calendar',
            timeline: 'timeline',
            gallery: 'gallery',
            board: 'board',
            kanban: 'board',
            feed: 'feed',
            list: 'list'
        };

        const viewType = Object.keys(viewTypeMap).find(t => lowerTags.includes(t))
            ? viewTypeMap[Object.keys(viewTypeMap).find(t => lowerTags.includes(t))!]
            : 'table';

        return {
            title: title.replace(pattern, '').trim(),
            viewType,
            layoutFlags: magicTags
        };
    }

    private static parseDatabaseProperties(properties: any, schema?: any): Record<string, any> {
        const parsed: Record<string, any> = {};
        if (!properties) return parsed;

        for (const [key, value] of Object.entries(properties)) {
            const prop = value as any;
            const type = prop.type;
            if (!type) continue;

            switch (type) {
                case 'title':
                case 'rich_text':
                    parsed[key] = prop[type]?.map((t: any) => t.plain_text).join('') || '';
                    break;
                case 'files':
                    parsed[key] = prop.files?.map((f: any) => f.file?.url || f.external?.url) || [];
                    break;
                case 'people':
                    parsed[key] = prop.people?.map((p: any) => ({
                        id: p.id, name: p.name, avatar_url: p.avatar_url
                    })) || [];
                    break;
                case 'formula':
                    parsed[key] = prop.formula[prop.formula.type];
                    break;
                case 'relation':
                    parsed[key] = prop.relation?.map((r: any) => r.id) || [];
                    break;
                case 'rollup':
                    parsed[key] = prop.rollup.type === 'array' ? prop.rollup.array : prop.rollup[prop.rollup.type];
                    break;
                case 'select':
                case 'multi_select':
                case 'date':
                case 'checkbox':
                case 'url':
                case 'email':
                case 'phone_number':
                case 'status':
                case 'created_time':
                case 'last_edited_time':
                case 'number':
                    parsed[key] = prop[type];
                    break;
                default:
                    parsed[key] = null;
            }
        }
        return parsed;
    }
}
