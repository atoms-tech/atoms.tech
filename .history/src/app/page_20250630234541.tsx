// app/page.tsx
import { Suspense } from 'react';

import { OAuthHandler } from '@/components/auth/OAuthHandler';
import { Contact } from '@/components/custom/LandingPage/contact';
import { CTA } from '@/components/custom/LandingPage/cta';
import { FeatureDemo } from '@/components/custom/LandingPage/feature-demo';
import { Features } from '@/components/custom/LandingPage/features';
import { Footer } from '@/components/custom/LandingPage/footer';
import { GridBackground } from '@/components/custom/LandingPage/grid-background';
import { Hero } from '@/components/custom/LandingPage/hero';
import { Industries } from '@/components/custom/LandingPage/industries';
import { Navbar } from '@/components/custom/LandingPage/navbar';
import { NewsletterSignup } from '@/components/custom/LandingPage/newsletter-signup';
import { ProblemSnapshot } from '@/components/custom/LandingPage/problem-snapshot';
import { SocialProof } from '@/components/custom/LandingPage/social-proof';
import { Stats } from '@/components/custom/LandingPage/stats';
import { Testimonials } from '@/components/custom/LandingPage/testimonials';
import { TimeSavingEdge } from '@/components/custom/LandingPage/time-saving-edge';
import { ProfilerWrapper } from '@/components/custom/ProfilerWrapper';

export default async function Home() {
    return (
        <ProfilerWrapper id="LandingPage">
            <div className="min-h-screen bg-[#0f0f0f] text-[#B5B5B5] relative">
                <div className="relative z-10">
                    <Navbar />
                    <main className="space-y-0">
                        <Hero />
                        <ProblemSnapshot
                            painPoint="Writing compliant requirements is slow, error‑prone—and bogged down by bloated legacy tools."
                            solution="A Word‑simple, spreadsheet‑smart workspace with built‑in AI that cuts effort by 50%—checking compliance, sharpening language, and keeping everything traceable."
                        />
                        <SocialProof />
                        <Features />
                        <FeatureDemo />
                        <Stats />
                        <TimeSavingEdge />
                        <Testimonials />
                        <Industries />
                        <div className="py-24 bg-black">
                            <div className="container mx-auto px-4">
                                <div className="max-w-2xl mx-auto">
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                                            STAY IN THE LOOP
                                        </h2>
                                        <p className="text-gray-300">
                                            Get updates on new features, tips,
                                            and industry insights
                                        </p>
                                    </div>
                                    <NewsletterSignup />
                                </div>
                            </div>
                        </div>
                        <CTA />
                        <Contact />
                    </main>
                    <Footer />
                </div>
                <GridBackground />
            </div>
        </ProfilerWrapper>
    );
}
