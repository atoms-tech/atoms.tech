import { AlertTriangle, Code, FileText } from 'lucide-react';

const demoFeatures = [
    {
        title: 'Spot Conflicts',
        description: 'one prompt highlights every clashing requirement.',
        icon: AlertTriangle,
    },
    {
        title: 'Draft Code',
        description: 'C++ / Python stubs generated from the specs you just cleaned.',
        icon: Code,
    },
    {
        title: 'File Issues',
        description: 'Jira tickets opened, linked, and assigned in a click.',
        icon: FileText,
    },
];

export function PolarionDemo() {
    return (
        <section className="py-24 md:py-32 lg:py-40 relative bg-white text-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="container mx-auto px-4">
                {/* Section Title */}
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-black leading-none mb-16 md:mb-24 text-center">
                    15-SECOND DEMOS
                </h2>

                {/* Demo Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 lg:gap-24 max-w-6xl mx-auto">
                    {demoFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative border-t-2 border-black pt-8 text-center hover:transform hover:scale-105 transition-all duration-300"
                        >
                            {/* Icon */}
                            <div className="mb-6 flex justify-center">
                                <feature.icon className="w-16 h-16 text-[#9B51E0] group-hover:text-black transition-colors duration-300" />
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-black mb-4 text-black tracking-tight">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover Effect Line */}
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-300" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />
        </section>
    );
}
