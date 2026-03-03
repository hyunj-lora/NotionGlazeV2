import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useStudioStore, type StudioBlock } from '../../stores/useStudioStore';
import { BlockRenderer } from './BlockRenderer';

interface Props {
    block: StudioBlock;
}

export const SortableBlock: React.FC<Props> = ({ block }) => {
    const { selectedVId, selectBlock } = useStudioStore();
    const isSelected = selectedVId === block.v_id;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.v_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: block.isSyncing ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            role="button"
            tabIndex={0}
            onClick={() => selectBlock(block.v_id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectBlock(block.v_id);
                }
            }}
            className={`group relative mb-2 p-4 rounded-xl border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${isSelected
                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5'
                : 'border-transparent hover:border-border/50 hover:bg-muted/30'
                } ${isDragging ? 'opacity-0' : ''}`}
        >
            {/* Drag Handle Area */}
            <div
                {...attributes}
                {...listeners}
                aria-label="Drag Handle"
                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 cursor-grab active:cursor-grabbing p-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-md"
            >
                <div className="grid grid-cols-2 gap-0.5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
                    ))}
                </div>
            </div>

            {/* Content Area (Refactored to BlockRenderer) */}
            <div className={`transition-all duration-300 ${block.isSyncing ? 'blur-[1px]' : ''}`}>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground/40'}`}>
                    {block.type}
                </div>
                <div className="text-foreground">
                    <BlockRenderer block={block} />
                </div>
            </div>

            {/* Syncing Indicator */}
            {block.isSyncing && (
                <div className="absolute top-2 right-2">
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-[10px] font-bold text-primary"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        SYNCING
                    </motion.div>
                </div>
            )}

            {/* Selection indicator line */}
            {isSelected && (
                <motion.div
                    layoutId="selection-bar"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full"
                />
            )}
        </div>
    );
};
