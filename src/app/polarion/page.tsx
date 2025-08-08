import type { Metadata } from 'next';

import { GridBackground } from '@/components/custom/LandingPage/grid-background';
import { Navbar } from '@/components/custom/LandingPage/navbar';
import { PolarionContact } from '@/components/custom/Polarion/contact';
import { PolarionDemo } from '@/components/custom/Polarion/demo';
import { PolarionHero } from '@/components/custom/Polarion/hero';
import { PolarionWhyGroundbreaking } from '@/components/custom/Polarion/why-groundbreaking';

export const metadata: Metadata = {
    title: 'Polarion Integration - ATOMS',
    description:
        'POLARION, MEET CURSOR-LEVEL AI. Chat with every work item, trace, test-even code.',
};

export default function PolarionPage() {
    return (
        <div className="min-h-screen bg-[#0f0f0f] text-[#B5B5B5] relative">
            <GridBackground />
            <div className="relative z-10">
                <Navbar />
                <main>
                    <PolarionHero />
                    <div className="section-divider">
                        <PolarionDemo />
                    </div>
                    <div className="section-divider">
                        <PolarionWhyGroundbreaking />
                    </div>
                    <div className="section-divider">
                        <PolarionContact />
                    </div>
                </main>
            </div>
        </div>
    );
}
