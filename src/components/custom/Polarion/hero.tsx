'use client';

import { Button } from '@/components/ui/button';

export function PolarionHero() {
    return (
        <section className="bg-[url('/nodesbackground.jpg')] bg-cover bg-center min-h-screen flex items-center justify-center pt-20 text-white relative overflow-hidden">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black opacity-80" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />

            <div className="container mx-auto px-4 relative z-20">
                <div className="max-w-7xl mx-auto">
                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 gap-16 lg:gap-24 items-center">
                        {/* Left Column - Text Content */}
                        <div className="text-center">
                            {/* Main Title */}
                            <h1 className="text-[32px] xs:text-[40px] sm:text-[48px] md:text-[64px] lg:text-[80px] xl:text-[96px] 2xl:text-[112px] font-black tracking-tighter text-white leading-none mb-8">
                                <span className="block">POLARION</span>
                                <span className="block whitespace-nowrap">
                                    MEET CURSOR-LEVEL AI
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#B5B5B5] mb-12 leading-relaxed">
                                Chat with every work item, trace, test—even code.
                            </p>

                            {/* CTA Button */}
                            <div className="flex justify-center">
                                <Button
                                    className="btn-primary text-xl px-16 py-8 hover:scale-105 transition-transform duration-200"
                                    onClick={() =>
                                        window.open(
                                            'mailto:hello@atoms.tech?subject=Polarian - ATOMS',
                                            '_self',
                                        )
                                    }
                                >
                                    REQUEST PRIVATE BETA
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
