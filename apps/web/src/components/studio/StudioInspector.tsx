import React from 'react';
import { useStudioStore } from '../../stores/useStudioStore';

export const StudioInspector: React.FC = () => {
    const { blocks, selectedVId } = useStudioStore();
    const selectedBlock = blocks.find(b => b.v_id === selectedVId);

    return (
        <aside className="w-80 border-l border-border bg-muted/30 flex flex-col h-full shrink-0 overflow-hidden">
            <header className="p-4 border-b border-border bg-background/50 backdrop-blur-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Inspector</h3>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {selectedBlock ? (
                    <>
                        <section>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-2">
                                Block Type
                            </label>
                            <div className="px-3 py-2 rounded-lg bg-background border border-border text-xs font-bold text-foreground capitalize">
                                {selectedBlock.type}
                            </div>
                        </section>

                        <section>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-2">
                                Virtual ID
                            </label>
                            <code className="block p-2 rounded bg-muted text-[10px] font-mono text-muted-foreground break-all">
                                {selectedBlock.v_id}
                            </code>
                        </section>

                        <section>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 block mb-2">
                                Notion ID
                            </label>
                            <code className="block p-2 rounded bg-muted text-[10px] font-mono text-muted-foreground break-all">
                                {selectedBlock.n_id}
                            </code>
                        </section>

                        <section className="pt-6 border-t border-border">
                            <h4 className="text-xs font-black mb-4">Content Preview</h4>
                            <div className="p-3 rounded-xl bg-background border border-border text-xs text-muted-foreground leading-relaxed">
                                {typeof selectedBlock.content === 'object'
                                    ? JSON.stringify(selectedBlock.content, null, 2)
                                    : selectedBlock.content || "No content available."}
                            </div>
                        </section>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 mb-4 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Select a block to <br />inspect properties</p>
                    </div>
                )}
            </div>

            {selectedBlock && (
                <footer className="p-4 border-t border-border bg-background/50">
                    <button className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
                        Save Changes
                    </button>
                </footer>
            )}
        </aside>
    );
};
