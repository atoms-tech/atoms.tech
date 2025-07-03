import { CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';

const stats = [
    {
        icon: TrendingUp,
        value: '50%',
        label: 'FASTER REQUIREMENTS',
        description: 'Average time reduction in requirements creation',
    },
    {
        icon: Users,
        value: '1000+',
        label: 'ACTIVE USERS',
        description: 'Engineers and teams using ATOMS.TECH daily',
    },
    {
        icon: Clock,
        value: '10K+',
        label: 'HOURS SAVED',
        description: 'Total time saved across all projects',
    },
    {
        icon: CheckCircle,
        value: '99.9%',
        label: 'COMPLIANCE RATE',
        description: 'Requirements meeting industry standards',
    },
];

export function Stats() {
    return (
        <section className="py-24 md:py-32 relative bg-white text-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-black leading-none mb-8">
                        BY THE NUMBERS
                    </h2>
                    <p className="text-xl md:text-2xl font-bold text-gray-600 max-w-3xl mx-auto">
                        REAL RESULTS FROM TEAMS WHO DITCHED THEIR OLD TOOLS
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="text-center group hover:scale-105 transition-transform duration-300"
                        >
                            <div className="mb-6 flex justify-center">
                                <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                                    <stat.icon className="w-12 h-12 text-purple-600" />
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-lg md:text-xl font-bold text-purple-600 tracking-tight">
                                    {stat.label}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed">
                                {stat.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-lg text-gray-500 font-medium">
                        * Based on user surveys and platform analytics from 2024
                    </p>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />
        </section>
    );
}
