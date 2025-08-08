import { AlertTriangle, Code, FileText } from 'lucide-react';
import Image from 'next/image';

const demoFeatures = [
    {
        title: 'Spot Conflicts',
        description: 'One prompt highlights every clashing requirement.',
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
        <section className="border-none py-24 md:py-32 lg:py-40 relative bg-[#0f0f0f]  text-white">
            <div className="container mx-auto px-4">
                {/* Demo Image */}
                <div className="relative">
                    {/* Floating Demo Container */}
                    <div className="relative group">
                        {/* Main Image Container */}
                        <div className="relative bg-black/50 backdrop-blur-sm rounded-0.1 border border-black/10 overflow-hidden shadow-2xl mb-10">
                            <Image
                                src="/cursor__polarian.jpg"
                                alt="Polarion AI Integration Demo - Chat interface with system architecture diagram and work items"
                                width={1024}
                                height={576}
                                className="w-full h-auto object-cover"
                                priority
                            />

                            {/* Overlay with subtle gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </div>
                    </div>

                    {/* Feature Callouts */}
                    <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 hidden xl:block">
                        <div className="bg-white/40 backdrop-blur-md rounded-lg p-4 border border-white/30 shadow-lg">
                            <div className="text-white font-bold text-sm mb-1">
                                AI Chat
                            </div>
                            <div className="text-[#E5E5E5] text-xs">
                                Natural language queries
                            </div>
                        </div>
                    </div>

                    <div className="absolute -right-8 bottom-1/4 hidden xl:block">
                        <div className="bg-white/40 backdrop-blur-md rounded-lg p-4 border border-white/30 shadow-lg">
                            <div className="text-white font-bold text-sm mb-1">
                                Work Items
                            </div>
                            <div className="text-[#E5E5E5] text-xs">
                                Instant access & updates
                            </div>
                        </div>
                    </div>
                </div>
                {/* Demo Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 lg:gap-24 max-w-6xl mx-auto">
                    {demoFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative border-t-2 border-white pt-8 text-center hover:transform hover:scale-105 transition-all duration-300"
                        >
                            {/* Icon */}
                            <div className="mb-6 flex justify-center">
                                <feature.icon className="w-16 h-16 text-[#9B51E0] group-hover:text-white transition-colors duration-300" />
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-white mb-4 text-white tracking-tight">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-base md:text-lg text-gray-00 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover Effect Line */}
                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
