import {
    HydrationBoundary,
    QueryClient,
    dehydrate,
} from '@tanstack/react-query';

import { Contact } from '@/components/custom/LandingPage/contact';
import { CTA } from '@/components/custom/LandingPage/cta';
import { Features } from '@/components/custom/LandingPage/features';
import { Footer } from '@/components/custom/LandingPage/footer';
import { GridBackground } from '@/components/custom/LandingPage/grid-background';
import { Hero } from '@/components/custom/LandingPage/hero';
import { HowItWorks } from '@/components/custom/LandingPage/how-it-works';
import { Industries } from '@/components/custom/LandingPage/industries';
import { Navbar } from '@/components/custom/LandingPage/navbar';
import { Testimonials } from '@/components/custom/LandingPage/testimonials';
import { TimeSavingEdge } from '@/components/custom/LandingPage/time-saving-edge';
import { queryKeys } from '@/lib/constants/queryKeys';
import {
    getAuthUserServer,
    getUserOrganizationsServer,
    getUserProjectsServer,
} from '@/lib/db/server';

export default async function Home() {
    // Initialize query client for server-side prefetching
    const queryClient = new QueryClient();

    try {
        // Try to get authenticated user
        const userData = await getAuthUserServer();

        if (userData?.user?.id) {
            // User is authenticated, prefetch organizations
            const organizations = await getUserOrganizationsServer(
                userData.user.id,
            );

            // Prefetch all organizations data
            await queryClient.prefetchQuery({
                queryKey: queryKeys.organizations.byMembership(
                    userData.user.id,
                ),
                queryFn: async () => organizations,
            });

            // For each organization, prefetch its projects
            for (const org of organizations) {
                await queryClient.prefetchQuery({
                    queryKey: queryKeys.projects.byOrganization(org.id),
                    queryFn: async () =>
                        getUserProjectsServer(userData.user.id, org.id),
                });
            }

            // After prefetching, redirect authenticated users to their home dashboard
            // Comment this out if you want authenticated users to still see the landing page
            // return redirect('/home/user');
        }
    } catch (error) {
        // If there's an error or user is not authenticated, just show the landing page
        console.error(
            'Error prefetching data or user not authenticated:',
            error,
        );
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
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
        </HydrationBoundary>
    );
}
