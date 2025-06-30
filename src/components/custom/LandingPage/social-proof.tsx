export function SocialProof() {
    const companies = [
        'AEROSPACE CORP',
        'DEFENSE TECH',
        'AUTOMOTIVE SYSTEMS',
        'MEDICAL DEVICES',
        'ENERGY SOLUTIONS',
        'ROBOTICS LAB'
    ];

    return (
        <section className="py-16 md:py-24 relative bg-gray-900 text-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-300 mb-8 tracking-wide">
                        TRUSTED BY ENGINEERING TEAMS AT
                    </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                    {companies.map((company, index) => (
                        <div
                            key={index}
                            className="text-center group hover:scale-105 transition-transform duration-300"
                        >
                            <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors">
                                <div className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                    {company}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-400 text-sm">
                        Join hundreds of engineering teams who have streamlined their requirements process
                    </p>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
        </section>
    );
}
