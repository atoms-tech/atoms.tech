'use client';

import { ScheduleDemoDialog } from '@/components/custom/LandingPage/schedule-demo-dialog';

export function CTA() {
    return (
        <section className="overflow-hidden section-padding relative bg-white text-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="container mx-auto px-4">
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-black leading-none mb-8">
                    WE’RE REWRITING HOW PRODUCTS GET BUILT.
                </h2>
                <p className="text-2xl md:text-3xl font-bold mb-16 text-black">
                    THE FUTURE OF SYSTEMS ENGINEERING WON&apos;T WAIT.
                    <br /> SWITCH NOW—OR GET LEFT BEHIND WITH THE FOSSILS.
                    <br /> AI ISN&apos;T JUST REVIEWING SPECS TRACING, TESTING,
                    DIAGRAMMING, AND CODING OFF YOUR REAL SYSTEM ARCHITECTURE.
                    <br /> THIS ISN&apos;T AN UPGRADE. IT&apos;S A NEW ERA.
                </p>
                <div className="flex flex-col md:flex-row justify-start space-y-8 md:space-y-0 md:space-x-12">
                    <ScheduleDemoDialog className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]" />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />
        </section>
    );
}
