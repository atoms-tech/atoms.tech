export function Contact() {
    return (
        <section
            id="contact"
            className="flex items-center justify-center bg-black text-white relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
            <div className="absolute inset-0 bg-black opacity-0" />
            <div className="text-center mx-auto px-8 py-16 relative z-20 w-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-0">
                    <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black leading-none text-white">
                        CONTACT
                    </h2>
                    <p className="text-2xl md:text-3xl font-bold text-primary lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2">
                        hello@atoms.tech
                    </p>
                </div>
            </div>
        </section>
    );
}
