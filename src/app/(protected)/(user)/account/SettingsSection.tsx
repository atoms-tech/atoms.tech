import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Children, useState } from 'react';
import { ReactNode } from 'react';

interface SettingsSectionProps {
    title: string;
    description: string;
    children: ReactNode;
}

export default function SettingsSection({
    title,
    description,
    children,
}: SettingsSectionProps) {
    const [isOpen, setIsOpen] = useState(false); // Set initial state to false

    return (
        <div className="flex flex-col gap-0">
            <div
                className="flex items-center cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
                <h3 className="ml-2 text-lg font-semibold">{title}</h3>
            </div>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-1"
            >
                <div className="flex items-start">
                    <div>
                        <h3 className="text-primary text-sm pl-3">
                            {description}
                        </h3>
                        <div className="mt-3 mb-3 text-sm">
                            {Children.map(children, (child) => (
                                <div className="pl-4 flex items-center">
                                    -&nbsp;&nbsp;{child}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
