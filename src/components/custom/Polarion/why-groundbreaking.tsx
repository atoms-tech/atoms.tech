import { ArrowRightLeft, Layers, MessageCircle, Zap } from 'lucide-react';

const groundbreakingFeatures = [
    {
        title: 'Ask Anything',
        description: 'plain-language Q&A across requirements, tests, and links.',
        icon: MessageCircle,
    },
    {
        title: 'Instant Hygiene',
        description: 'duplicates, gaps, and contradictions surfaced in seconds.',
        icon: Zap,
    },
    {
        title: 'One-Step Synthesis',
        description: 'tests, diagrams, and real code generated from context.',
        icon: Layers,
    },
    {
        title: 'Zero Swivel-Chair',
        description: 'email, tickets, and CI updates pushed from one pane.',
        icon: ArrowRightLeft,
    },
];
export function PolarionWhyGroundbreaking() {
    return (
        <section className="py-24 md:py-32 lg:py-40 relative bg-[#0f0f0f] text-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="container mx-auto px-4">
                {/* Section Title */}
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-white leading-none mb-16 md:mb-24 text-center">
                    WHY IT&apos;S GROUNDBREAKING
                </h2>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 lg:gap-24 max-w-6xl mx-auto">
                    {groundbreakingFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative border-t-2 border-white pt-8 hover:transform hover:scale-105 transition-all duration-300"
                        >
                            {/* Title with Icon */}
                            <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 text-white tracking-tight flex items-start">
                                <feature.icon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-[#9B51E0] group-hover:text-white transition-colors duration-300 mr-3 mt-1 flex-shrink-0" />
                                <span>{feature.title}</span>
                            </h3>

                            {/* Description */}
                            <p className="text-base md:text-lg text-[#B5B5B5] leading-relaxed ml-11 md:ml-12 lg:ml-14">
                                {feature.description}
                            </p>

                            {/* Hover Effect Line */}
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
                        </div>
                    ))}
                </div>

                {/* Additional Note */}
                <div className="mt-16 md:mt-24 text-center">
                    <p className="text-lg md:text-xl text-[#B5B5B5] max-w-4xl mx-auto leading-relaxed">
                        (Read-only today for total data safety. Write-back lands next
                        release.)
                    </p>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
        </section>
    );
}
