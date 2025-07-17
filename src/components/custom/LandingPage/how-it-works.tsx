export function HowItWorks() {
    const steps = [
        {
            title: 'WRITE IT LIKE WORD',
            description:
                "Just start typing. Drop in images and tables if you want. No convoluted forms—it's the same comfortable editing you already know.",
        },
        {
            title: 'ORGANIZE IT LIKE EXCEL',
            description:
                "Each requirement lives in its own row, so everything stays neat and sortable. Because good structure shouldn't be rocket science.",
        },
        {
            title: 'LET AI TIE IT ALL TOGETHER',
            description:
                'Our AI assists system engineers in writing better requirements by suggesting improvements, rewriting to EARS or INCOSE industry standards, and fact-checking against regulation documents. This ensures high-quality, compliant requirements throughout your project.',
        },
    ];

    return (
        <section
            id="how-it-works"
            className="py-24 md:py-32 lg:py-40 relative bg-white text-black"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="container mx-auto px-4">
                <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-black leading-none mb-16 md:mb-24">
                    HOW IT WORKS
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 lg:gap-24">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="group relative border-t-2 border-black pt-8"
                        >
                            <h3 className="text-xl md:text-2xl font-black mb-4 text-black tracking-tight">
                                {step.title}
                            </h3>

                            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                                {step.description}
                            </p>

                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-black group-hover:w-full transition-all duration-300" />
                        </div>
                    ))}
                </div>
                <p className="text-xl md:text-2xl font-bold text-white mt-12 text-center">
                    You can be up and running in under 10 minutes—no special training
                    needed.
                </p>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />
        </section>
    );
}
