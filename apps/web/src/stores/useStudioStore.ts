import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface StudioBlock {
    v_id: string; // Stable Virtual ID
    n_id: string; // Native Notion ID
    type: string;
    content: any;
    isSyncing?: boolean;
}

export type StudioOperation =
    | { type: 'move'; v_id: string; targetIndex: number; timestamp: number }
    | { type: 'create'; v_id: string; blockType: string; content: any; timestamp: number }
    | { type: 'update'; v_id: string; content: any; timestamp: number };

interface StudioState {
    blocks: StudioBlock[];
    history: StudioBlock[][]; // Snapshot history for rollbacks
    pendingOperations: StudioOperation[];
    selectedVId: string | null;

    // Actions
    setBlocks: (rawBlocks: any[]) => void;
    reconcileIds: (idMap: Record<string, string>) => void;
    moveBlock: (v_id: string, targetIndex: number) => void;
    selectBlock: (v_id: string | null) => void;
    addBlock: (type: string, content: any) => void;

    // Rollback & Cleanup
    rollback: () => void;
    clearPending: () => void;
    resetStore: () => void;
}

export const useStudioStore = create<StudioState>((set) => ({
    blocks: [],
    history: [],
    pendingOperations: [],
    selectedVId: null,

    setBlocks: (rawBlocks) => set((state) => ({
        blocks: rawBlocks.map((block) => ({
            v_id: block.v_id || uuidv4(),
            n_id: block.id || block.n_id,
            type: block.type,
            content: block[block.type] || block.content,
            isSyncing: false
        })),
        history: [] // Clear history on new data load
    })),

    reconcileIds: (idMap) => set((state) => ({
        blocks: state.blocks.map((block) => {
            const newId = idMap[block.n_id];
            if (newId) {
                return { ...block, n_id: newId, isSyncing: false };
            }
            return block;
        })
    })),

    moveBlock: (v_id, targetIndex) => set((state) => {
        const newBlocks = [...state.blocks];
        const sourceIndex = newBlocks.findIndex(b => b.v_id === v_id);
        if (sourceIndex === -1) return state;

        // Snapshot for rollback
        const historySnapshot = [...state.blocks];

        const [movedBlock] = newBlocks.splice(sourceIndex, 1);
        newBlocks.splice(targetIndex, 0, { ...movedBlock, isSyncing: true });

        const operation: StudioOperation = {
            type: 'move',
            v_id,
            targetIndex,
            timestamp: Date.now()
        };

        return {
            blocks: newBlocks,
            history: [historySnapshot, ...state.history].slice(0, 10), // Keep last 10 steps
            pendingOperations: [...state.pendingOperations, operation]
        };
    }),

    addBlock: (type, content) => set((state) => {
        const v_id = uuidv4();

        // Snapshot for rollback
        const historySnapshot = [...state.blocks];

        const newBlock: StudioBlock = {
            v_id,
            n_id: `temp-${v_id}`,
            type,
            content,
            isSyncing: true
        };

        const operation: StudioOperation = {
            type: 'create',
            v_id,
            blockType: type,
            content,
            timestamp: Date.now()
        };

        return {
            blocks: [...state.blocks, newBlock],
            history: [historySnapshot, ...state.history].slice(0, 10),
            pendingOperations: [...state.pendingOperations, operation],
            selectedVId: v_id
        };
    }),

    selectBlock: (v_id) => set({ selectedVId: v_id }),

    rollback: () => set((state) => {
        if (state.history.length === 0) return state;
        const [lastSnapshot, ...remainingHistory] = state.history;
        return {
            blocks: lastSnapshot,
            history: remainingHistory,
            pendingOperations: state.pendingOperations.slice(0, -1) // Revert last op
        };
    }),

    clearPending: () => set({ pendingOperations: [] }),

    resetStore: () => set({ blocks: [], history: [], pendingOperations: [], selectedVId: null })
}));
