import React from 'react';
import type { StudioBlock } from '../../stores/useStudioStore';

interface Props {
    block: StudioBlock;
}

export const BlockRenderer: React.FC<Props> = ({ block }) => {
    const renderContent = () => {
        switch (block.type) {
            case 'heading_1':
                return (
                    <h1 className="text-3xl font-black tracking-tight text-foreground">
                        {block.content?.rich_text?.[0]?.plain_text || block.content}
                    </h1>
                );
            case 'heading_2':
                return (
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        {block.content?.rich_text?.[0]?.plain_text || block.content}
                    </h2>
                );
            case 'callout':
                return (
                    <div className="flex gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 items-start">
                        <span className="text-xl shrink-0">{block.content?.icon?.emoji || '🚀'}</span>
                        <p className="text-sm font-medium leading-relaxed">
                            {block.content?.rich_text?.[0]?.plain_text || "Callout content"}
                        </p>
                    </div>
                );
            case 'paragraph':
            default:
                return (
                    <p className="text-sm font-medium leading-relaxed text-foreground opacity-80">
                        {typeof block.content === 'string'
                            ? block.content
                            : (block.content?.rich_text?.[0]?.plain_text || "Empty paragraph")}
                    </p>
                );
        }
    };

    return (
        <div className="block-content-view">
            {renderContent()}
        </div>
    );
};
