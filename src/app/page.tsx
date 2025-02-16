'use client';
import { Navbar } from '@/components/custom/LandingPage/navbar';
import { Hero } from '@/components/custom/LandingPage/hero';
import { Features } from '@/components/custom/LandingPage/features';
import { HowItWorks } from '@/components/custom/LandingPage/how-it-works';
import { TimeSavingEdge } from '@/components/custom/LandingPage/time-saving-edge';
import { Industries } from '@/components/custom/LandingPage/industries';
import { Testimonials } from '@/components/custom/LandingPage/testimonials';
import { CTA } from '@/components/custom/LandingPage/cta';
import { Contact } from '@/components/custom/LandingPage/contact';
import { Footer } from '@/components/custom/LandingPage/footer';
import { GridBackground } from '@/components/custom/LandingPage/grid-background';

export default function Home() {
    return (
        <div className="min-h-screen bg-[#0f0f0f] text-[#B5B5B5] relative">
            <div className="relative z-10">
                <Navbar />
                <main className="space-y-64">
                    <Hero />
                    <div className="section-divider">
                        <Features />
                    </div>
                    <HowItWorks />
                    <TimeSavingEdge />
                    <div className="section-divider">
                        <Industries />
                    </div>
                    <Testimonials />
                    <div className="section-divider">
                        <CTA />
                    </div>
                    <div className="section-divider">
                        <Contact />
                    </div>
                </main>
                <Footer />
            </div>
            <GridBackground />
        </div>
    );
}
