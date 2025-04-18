'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

type FeatureType = 'writing' | 'analysis' | 'diagram';

interface FeatureDemoProps {
    className?: string;
}

export function FeatureDemo({ className }: FeatureDemoProps) {
    const [activeFeature, setActiveFeature] = useState<FeatureType>('writing');

    const features = [
        {
            id: 'writing',
            title: 'Writing Requirements',
            description:
                'Write requirements in a natural, human way with our intuitive interface.',
            gifPath: '/WriteRequirement.gif',
        },
        {
            id: 'analysis',
            title: 'AI Requirement Analysis',
            description:
                'Our AI analyzes your requirements for clarity, completeness, and coherence.',
            gifPath: '/Analysis.gif',
        },
        {
            id: 'diagram',
            title: 'Requirement to Diagram',
            description:
                'Automatically generate visual diagrams from your written requirements.',
            gifPath: '/RequirementToDiagram.gif',
        },
    ];

    return (
        <section
            className={cn(
                'py-24 md:py-32 relative bg-black text-white',
                className,
            )}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="container mx-auto px-4">
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-white leading-none mb-16 md:mb-24">
                    SEE IT IN ACTION
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="flex flex-col gap-4">
                        {features.map((feature) => (
                            <button
                                key={feature.id}
                                onClick={() =>
                                    setActiveFeature(feature.id as FeatureType)
                                }
                                className={cn(
                                    'text-left p-4 rounded-lg transition-all duration-300',
                                    activeFeature === feature.id
                                        ? 'bg-[#9B51E0]/10 border border-[#9B51E0]'
                                        : 'border border-white/10 hover:border-white/30',
                                )}
                            >
                                <h3 className="text-xl font-bold mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-gray-300">
                                    {feature.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-2 bg-zinc-900 rounded-lg overflow-hidden border border-white/10 relative aspect-video">
                        {features.map((feature) => (
                            <motion.div
                                key={feature.id}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity:
                                        activeFeature === feature.id ? 1 : 0,
                                    zIndex:
                                        activeFeature === feature.id ? 10 : 0,
                                }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0"
                            >
                                <Image
                                    src={feature.gifPath}
                                    alt={feature.title}
                                    fill
                                    className="object-cover"
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
