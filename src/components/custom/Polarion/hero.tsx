import { Button } from '@/components/ui/button';

export function PolarionHero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-6xl mx-auto">
                    {/* Main Title */}
                    <h1 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[128px] font-black tracking-tighter text-white leading-none mb-8">
                        POLARION, MEET CURSOR-LEVEL AI
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#B5B5B5] mb-12 max-w-4xl mx-auto leading-relaxed">
                        Chat with every work item, trace, test—even code.
                    </p>

                    {/* CTA Button */}
                    <div className="flex justify-center">
                        <Button className="btn-primary text-xl px-16 py-8 hover:scale-105 transition-transform duration-200">
                            REQUEST PRIVATE BETA
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
