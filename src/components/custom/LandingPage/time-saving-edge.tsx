import { Clock, AlertTriangle, ShieldCheck, Share2 } from 'lucide-react';

const benefits = [
    {
        icon: Clock,
        title: '50% FASTER REQUIREMENT UPDATES',
        description:
            'We handle the grunt work so you can focus on actual engineering.',
    },
    {
        icon: AlertTriangle,
        title: 'FEWER ERRORS & OVERSIGHTS',
        description:
            'Catch duplicates, unit mismatches, and extraneous requirements before they derail a project.',
    },
    {
        icon: ShieldCheck,
        title: 'INSTANTLY MEET COMPLIANCE',
        description:
            'Avoid the usual back-and-forth with your regulatory team—our AI cross-checks everything for you.',
    },
    {
        icon: Share2,
        title: 'CLEANER HANDOFFS',
        description:
            'A single source of truth makes it easy to share, review, and finalize across teams.',
    },
];

export function TimeSavingEdge() {
    return (
        <section className="section-padding relative bg-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="container mx-auto px-4">
                <h2 className="text-[38px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-white leading-none mb-24 whitespace-nowrap overflow-hidden">
                    WHY THIS MATTERS
                </h2>
                <div className="grid md:grid-cols-2 gap-16">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="group relative border-t-2 border-white pt-8"
                        >
                            <div className="mb-6">
                                <benefit.icon className="w-16 h-16 text-[#9B51E0]" />
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-white tracking-tight">
                                {benefit.title}
                            </h3>
                            <p className="text-base text-gray-300 leading-relaxed">
                                {benefit.description}
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
