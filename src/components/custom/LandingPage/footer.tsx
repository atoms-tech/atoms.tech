import Link from 'next/link';

export function Footer() {
    return (
        <footer className="py-32 bg-black/60 text-white">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-16 md:space-y-0">
                    <div>
                        <Link href="/" className="atoms-logo">
                            ATOMS.TECH
                        </Link>
                    </div>
                    <nav className="flex space-x-24">
                        <Link
                            href="#contact"
                            className="text-xl text-white hover:text-gray-300 transition-colors uppercase"
                        >
                            Contact
                        </Link>
                    </nav>
                </div>
                <div className="mt-32 text-center">
                    <p className="text-gray-400 text-lg uppercase">
                        © 2025 ATOMS.TECH. WE CAN&apos;T PROMISE IMMORTALITY, BUT WE DO
                        PROMISE FASTER REQUIREMENTS.
                    </p>
                </div>
            </div>
        </footer>
    );
}
