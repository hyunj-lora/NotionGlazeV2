import React, { useEffect } from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import { StudioCanvas } from './StudioCanvas';
import { StudioOutliner } from './StudioOutliner';
import { StudioInspector } from './StudioInspector';
import { FloatingActionToolbar } from './FloatingActionToolbar';

interface Props {
    initialBlocks?: any[];
}

export const StudioLayout: React.FC<Props> = ({ initialBlocks }) => {
    const { blocks, setBlocks } = useStudioStore();

    // Initial Hydration from Props
    useEffect(() => {
        if (initialBlocks && initialBlocks.length > 0 && blocks.length === 0) {
            setBlocks(initialBlocks);
        }
    }, [initialBlocks]);

    return (
        <div className="flex bg-background text-foreground h-screen overflow-hidden selection:bg-primary/20">
            {/* Left: Outliner */}
            <StudioOutliner />

            {/* Center: Canvas Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden h-full">
                <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Studio Mode
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <h1 className="text-sm font-black tracking-tight">
                            Untitled Page <span className="text-muted-foreground/30 ml-2">/</span> <span className="text-xs text-muted-foreground font-medium">Auto-saving</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border rounded-lg">
                            Preview
                        </button>
                        <button className="px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                            Publish
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto h-full scrollbar-none pb-32">
                    <StudioCanvas />
                </main>

                <FloatingActionToolbar block={null} />
            </div>

            {/* Right: Inspector */}
            <StudioInspector />
        </div>
    );
};
