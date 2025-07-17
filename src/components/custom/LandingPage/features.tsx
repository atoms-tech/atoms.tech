import { Brain, FileCheck, FileText, GitMerge, TestTube, Zap } from 'lucide-react';

const features = [
    {
        icon: FileText,
        title: 'TYPE LIKE A HUMAN',
        description:
            'Draft requirements in a familiar editor—no clunky forms or modal hell.',
    },
    {
        icon: Brain,
        title: 'AI REWRITES & CHECKS',
        description:
            'One click to restructure text into industry formats (EARS, INCOSE) and flag missing details.',
    },
    {
        icon: FileCheck,
        title: 'INSTANT COMPLIANCE CHECKS',
        description:
            "Cross-reference every line against regulations so surprises don't surface at audit time.",
    },
    {
        icon: GitMerge,
        title: 'BYE-BYE EXCEL HELL',
        description:
            'Visual traceability without monstrous spreadsheets—relationships update in real time.',
    },
    {
        icon: Zap,
        title: 'SNAPPY & LIGHTWEIGHT',
        description:
            'Loads fast, saves instantly, and stays smooth even with thousands of requirements.',
    },
    {
        icon: TestTube,
        title: 'ONE-CLICK TEST CASES',
        description:
            'Generate structured test cases directly from every requirement—no manual scripting.',
    },
];

export function Features() {
    return (
        <section
            id="features"
            className="py-24 md:py-32 lg:py-40 relative bg-black text-white"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="container mx-auto px-4">
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-white leading-none mb-16 md:mb-24">
                    CORE FEATURES
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-24">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative border-t-2 border-white pt-8"
                        >
                            <div className="mb-6">
                                <feature.icon className="w-12 h-12 text-[#9B51E0]" />
                            </div>

                            <h3 className="text-xl md:text-2xl font-black mb-4 text-white tracking-tight">
                                {feature.title}
                            </h3>

                            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                                {feature.description}
                            </p>

                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
        </section>
    );
}
