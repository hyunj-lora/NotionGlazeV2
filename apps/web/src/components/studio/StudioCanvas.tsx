import React, { useEffect, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStudioStore } from '../../stores/useStudioStore';
import { SortableBlock } from './SortableBlock';

export const StudioCanvas: React.FC = () => {
    const { blocks, moveBlock, addBlock, pendingOperations, clearPending } = useStudioStore();
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const newIndex = blocks.findIndex((b) => b.v_id === over.id);
            moveBlock(active.id as string, newIndex);
        }
    };

    // Buffered Command Pipeline (Batching)
    useEffect(() => {
        if (pendingOperations.length === 0) return;

        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(async () => {
            console.log('🚀 Dispatching batch move...', pendingOperations);
            // In a real implementation:
            // await fetch('/api/v1/blocks/move', { ... });
            // clearPending(); 
        }, 500);

        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, [pendingOperations]);

    return (
        <div className="max-w-4xl mx-auto py-20 px-8">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={blocks.map((b) => b.v_id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {blocks.map((block) => (
                            <SortableBlock key={block.v_id} block={block} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="mt-8 pb-32">
                <button
                    onClick={() => addBlock('paragraph', { rich_text: [{ plain_text: "" }] })}
                    className="group w-full h-8 flex items-center gap-3 px-2 opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none transition-all duration-200 -ml-2"
                    aria-label="Append new block"
                >
                    <div className="w-4 h-4 rounded bg-primary text-primary-foreground flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </div>
                    <div className="h-px bg-primary/20 flex-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Click to append block</span>
                    <div className="h-px bg-primary/20 flex-1" />
                </button>
            </div>
        </div>
    );
};
