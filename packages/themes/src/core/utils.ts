
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
