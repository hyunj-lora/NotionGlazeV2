const HIDE_MARKER = "#!hush";

/**
 * Checks if a block should be hidden based on the content starting with #!hush.
 * Supports any block with rich_text content (Paragraph, Toggle, Code, etc.)
 */
export function shouldHideBlock(block: any): boolean {
    const firstText = block?.content?.rich_text?.[0]?.plain_text;
    return (
        typeof firstText === "string" &&
        firstText.trim().toLowerCase().startsWith(HIDE_MARKER)
    );
}

/**
 * Groups adjacent list items of the same type (bulleted or numbered) 
 * into a single group for easier rendering in <ul> or <ol> tags.
 */
export function groupBlocks(blocks: any[]) {
    const groupedBlocks = [];
    let currentList: any = null;

    for (const block of blocks) {
        if (
            block.type === "bulleted_list_item" ||
            block.type === "numbered_list_item"
        ) {
            if (!currentList || currentList.type !== block.type + "s") {
                currentList = {
                    type: block.type + "s",
                    items: [block],
                };
                groupedBlocks.push(currentList);
            } else {
                currentList.items.push(block);
            }
        } else {
            currentList = null;
            groupedBlocks.push(block);
        }
    }
    return groupedBlocks;
}
