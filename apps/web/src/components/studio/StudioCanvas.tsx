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

            <div className="mt-20 border-t border-dashed border-border py-12 text-center">
                <button
                    onClick={() => addBlock('paragraph', { rich_text: [{ plain_text: "" }] })}
                    aria-label="Add new block"
                    className="text-xs font-bold text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-2 mx-auto focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-md px-2 py-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    Add new block here
                </button>
            </div>
        </div>
    );
};
