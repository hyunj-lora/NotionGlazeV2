import React from 'react';
import { useStudioStore } from '../../stores/useStudioStore';

export const StudioOutliner: React.FC = () => {
    const { blocks, selectedVId, selectBlock } = useStudioStore();

    return (
        <aside className="w-64 border-r border-border bg-muted/30 flex flex-col h-full overflow-hidden shrink-0">
            <header className="p-4 border-b border-border bg-background/50 backdrop-blur-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Outliner</h3>
            </header>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {blocks.map((block) => (
                    <button
                        key={block.v_id}
                        onClick={() => selectBlock(block.v_id)}
                        className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all flex items-center gap-2 group ${selectedVId === block.v_id
                                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedVId === block.v_id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        <span className="text-xs font-bold truncate">
                            {block.type}
                        </span>
                        {block.isSyncing && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                    </button>
                ))}
            </div>
        </aside>
    );
};
