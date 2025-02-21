import { Activity, Car, Cpu, Rocket, Shield, Zap } from 'lucide-react';

const industries = [
    {
        name: 'AUTOMOTIVE',
        icon: Car,
        description:
            'Electric vehicles, ADAS, or connected systems—trace it all.',
    },
    {
        name: 'HEALTHCARE',
        icon: Activity,
        description: 'Medical devices with strict FDA/regulatory checks.',
    },
    {
        name: 'AEROSPACE',
        icon: Rocket,
        description:
            'Flight systems, avionics, and mission-critical processes.',
    },
    {
        name: 'ROBOTICS',
        icon: Cpu,
        description:
            'Multi-sensor, multi-component synergy for advanced automation.',
    },
    {
        name: 'DoD',
        icon: Shield,
        description:
            'High-stakes defense projects that demand bulletproof compliance.',
    },
    {
        name: 'ENERGY',
        icon: Zap,
        description:
            'Solar, oil & gas, wind—align with safety and environmental regs.',
    },
];

export function Industries() {
    return (
        <section
            id="industries"
            className="py-24 md:py-32 lg:py-40 relative bg-white text-black"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="container mx-auto px-4">
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-black leading-none mb-16 md:mb-24">
                    BUILT FOR COMPLEX SAFETY CRITICAL SYSTEMS
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-24">
                    {industries.map((industry, index) => (
                        <div
                            key={index}
                            className="group relative border-t-2 border-black pt-8"
                        >
                            <div className="mb-6">
                                <industry.icon className="w-12 h-12 text-[#9B51E0]" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-black mb-4 text-black tracking-tight">
                                {industry.name}
                            </h3>
                            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                                {industry.description}
                            </p>
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-300" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />
        </section>
    );
}
