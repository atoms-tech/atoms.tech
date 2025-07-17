import { AlertTriangle, Clock, Share2, ShieldCheck } from 'lucide-react';

const benefits = [
    {
        icon: Clock,
        title: '50 % FASTER UPDATES',
        description: 'AI drafts and edits in moments—keeping you focused on engineering.',
    },
    {
        icon: AlertTriangle,
        title: 'ERRORS CAUGHT UPFRONT',
        description:
            'Detect duplicates, unit mismatches, and conflicts early—saving millions and preventing downstream risks.',
    },
    {
        icon: ShieldCheck,
        title: 'COMPLIANCE ON DAY ONE',
        description:
            'Auto cross-checks flag every regulation clause; skip the back-and-forth rewrites.',
    },
    {
        icon: Share2,
        title: 'FRICTIONLESS HANDOFFS',
        description:
            'One live source of truth speeds reviews, sign-offs, and audit trails for the whole team.',
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
