import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isVisible: boolean;
    blockId: string | null;
    position: { x: number; y: number };
}

export const FloatingActionToolbar: React.FC<Props> = ({ isVisible, blockId, position }) => {
    return (
        <AnimatePresence>
            {isVisible && blockId && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    style={{
                        position: 'fixed',
                        left: position.x,
                        top: position.y - 60,
                        transform: 'translateX(-50%)',
                        zIndex: 100
                    }}
                    className="flex items-center gap-1 p-1.5 rounded-2xl bg-foreground text-background shadow-2xl shadow-primary/20 backdrop-blur-xl"
                >
                    <button className="px-3 py-1.5 text-[10px] font-black hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/5">
                        STYLE
                    </button>
                    <div className="w-[1px] h-3 bg-white/20 mx-1" />
                    <button className="px-3 py-1.5 text-[10px] font-black hover:bg-white/10 rounded-lg transition-colors">
                        SEO
                    </button>
                    <button className="px-3 py-1.5 text-[10px] font-black hover:bg-white/10 rounded-lg transition-colors text-red-400">
                        DELETE
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
