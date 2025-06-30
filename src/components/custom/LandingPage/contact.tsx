export function Contact() {
    return (
        <section
            id="contact"
            className="overflow-hidden py-16 relative bg-black text-white"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
            <div className="absolute inset-0 bg-black opacity-0" />
            <div className="container mx-auto px-4 relative z-20 text-center">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 xl:gap-0">
                    <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[96px] font-black leading-none text-white">
                        CONTACT
                    </h2>
                    <p
                        className="text-2xl xl:text-3xl font-bold xl:absolute xl:left-1/2 xl:transform xl:-translate-x-1/2"
                        style={{ color: '#7C3AED' }}
                    >
                        <a 
                            href="mailto:hello@atoms.tech">hello@atoms.tech
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
}
