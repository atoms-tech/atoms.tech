import { Brain, FileCheck, FileText, GitMerge, Zap } from 'lucide-react';

const features = [
    {
        icon: FileText,
        title: 'TYPE LIKE A HUMAN',
        description:
            "Write requirements as if you're scribbling in Word—minus the weird formatting quirks.",
    },
    {
        icon: Brain,
        title: 'AI THAT ACTUALLY HELPS',
        description:
            "Our AI's not here for show. It polishes your requirements, checks your grammar, and calls you out on nonsense.",
    },
    {
        icon: FileCheck,
        title: 'NO MORE LEGAL SURPRISES',
        description:
            "Dump in your industry regs. We'll highlight every violation so you don't get blindsided by compliance lawyers.",
    },
    {
        icon: GitMerge,
        title: 'BYE-BYE EXCEL HELL',
        description:
            'Visualize everything, see duplicates, and catch conflicts. Because you have better things to do than cross-referencing spreadsheets.',
    },
    {
        icon: Zap,
        title: 'SPEED. PERIOD.',
        description:
            "Snappy load times. Instant updates. You won't be stuck twiddling your thumbs while some spinny wheel of death does its thing.",
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
