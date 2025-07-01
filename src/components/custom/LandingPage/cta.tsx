'use client';

import { ScheduleDemoDialog } from '@/components/custom/LandingPage/schedule-demo-dialog';

export function CTA() {
    return (
        <section className="overflow-hidden section-padding relative bg-white text-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="container mx-auto px-4">
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-black leading-none mb-8">
                    STILL USING THAT DINOSAUR OF A REQUIREMENTS TOOL?
                </h2>
                <p className="text-2xl md:text-3xl font-bold mb-16 text-black">
                    IT&apos;S TIME TO UPGRADE. SIGN UP NOW OR WATCH YOUR OLD
                    SOFTWARE CRUMBLE UNDER ITS OWN WEIGHT.
                </p>
                <div className="flex flex-col md:flex-row justify-start space-y-8 md:space-y-0 md:space-x-12">
                    <ScheduleDemoDialog className="bg-[#7C3AED] text-white hover:bg-[#6D28D9]" />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />
        </section>
    );
}
