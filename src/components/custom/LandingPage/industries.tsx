import { Activity, Car, Cpu, Rocket, Shield, Zap } from 'lucide-react';

const industries = [
    {
        name: 'AUTOMOTIVE',
        icon: Car,
        description:
            'Trace every requirement across the entire vehicle stack—from powertrain and braking to EV, ADAS, and connected-car systems.',
    },
    {
        name: 'HEALTHCARE',
        icon: Activity,
        description:
            'Align medical devices with key standards—such as ISO 13485, ISO 14971, and IEC 62304.',
    },
    {
        name: 'AEROSPACE',
        icon: Rocket,
        description:
            'Meet critical aviation regulations—such as DO-178C, DO-254, and ARP-4754A.',
    },
    {
        name: 'ENERGY',
        icon: Zap,
        description:
            'Hit safety & environmental regs across wind, solar, oil & gas, and large-scale energy storage.',
    },
    {
        name: 'ROBOTICS',
        icon: Cpu,
        description:
            'Synchronize multi-sensor autonomy with full traceability.',
    },
    {
        name: 'DEFENSE / DoD',
        icon: Shield,
        description: 'Deliver bulletproof compliance for high-stakes programs.',
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
                    BUILT FOR SAFETY-CRITICAL SYSTEMS
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
