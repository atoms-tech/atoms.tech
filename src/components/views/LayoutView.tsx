"use client";

import { useSettingsStore } from "@/lib/store/settings.store";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface LayoutViewProps {
    children: ReactNode;
}

function LayoutView({ children }: LayoutViewProps) {
    const { layoutViewMode } = useSettingsStore();

    return (
            <motion.div
                initial={false}
                animate={layoutViewMode} // Animation changes based on mode
                variants={{
                    standard: {
                        width: "50%", // Adjust width for standard mode
                    },
                    wide: {
                        width: "100%", // Adjust width for wide mode
                    },
                }}
                transition={{
                    duration: 0.5,
                    ease: "linear",
                }}
                className="flex flex-col w-full bg-background text-foreground mx-auto"
            >
                {children}
            </motion.div>
    );
}

export default LayoutView;