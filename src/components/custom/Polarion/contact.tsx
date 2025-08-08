import Image from 'next/image';
import Link from 'next/link';

export function PolarionContact() {
    return (
        <section className="py-24 md:py-32 lg:py-40 relative bg-white text-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-black" />
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    {/* Built by ATOMS.tech */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <span className="text-xl md:text-2xl font-bold text-black">
                                Built by
                            </span>
                            <Link
                                href="/"
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <Image
                                    src="/atom.png"
                                    alt="Atoms logo"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                                <span className="text-2xl md:text-3xl font-black text-black tracking-wide">
                                    ATOMS
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="border-t-2 border-black pt-8">
                        <Link
                            href="mailto:hello@atoms.tech"
                            className="text-xl md:text-2xl font-bold text-black hover:text-[#9B51E0] transition-colors duration-300 underline underline-offset-4"
                        >
                            hello@atoms.tech
                        </Link>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black" />
        </section>
    );
}
