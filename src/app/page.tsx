// app/page.tsx
import { Contact } from '@/components/custom/LandingPage/contact';
import { CTA } from '@/components/custom/LandingPage/cta';
import { FeatureDemo } from '@/components/custom/LandingPage/feature-demo';
import { Features } from '@/components/custom/LandingPage/features';
import { Footer } from '@/components/custom/LandingPage/footer';
import { GridBackground } from '@/components/custom/LandingPage/grid-background';
import { Hero } from '@/components/custom/LandingPage/hero';
import { Industries } from '@/components/custom/LandingPage/industries';
import { Navbar } from '@/components/custom/LandingPage/navbar';
import { ProblemSnapshot } from '@/components/custom/LandingPage/problem-snapshot';
import { TimeSavingEdge } from '@/components/custom/LandingPage/time-saving-edge';
import { ProfilerWrapper } from '@/components/custom/ProfilerWrapper';

export default async function Home() {
    return (
        <ProfilerWrapper id="LandingPage">
            <div className="min-h-screen bg-[#0f0f0f] text-[#B5B5B5] relative">
                <div className="relative z-10">
                    <Navbar />
                    <main className="space-y-64">
                        <Hero />
                        <div className="section-divider">
                            <ProblemSnapshot
                                painPoint="Writing compliant requirements is slow, error‑prone—and bogged down by bloated legacy tools."
                                solution="A Word‑simple, spreadsheet‑smart workspace with built‑in AI that cuts effort by 50%—checking compliance, sharpening language, and keeping everything traceable."
                            />
                        </div>
                        <div className="section-divider">
                            <Features />
                        </div>
                        <div className="section-divider">
                            <FeatureDemo />
                        </div>
                        <TimeSavingEdge />
                        <div className="section-divider">
                            <Industries />
                        </div>
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
        </ProfilerWrapper>
    );
}
