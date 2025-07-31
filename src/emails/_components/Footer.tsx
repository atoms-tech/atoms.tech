import { Link } from '@react-email/components';

export default function Footer() {
    return (
        <>
            <hr className="border-gray-50 my-5" />
            <Link
                href="https://atoms.tech"
                className="block underline text-left text-gray-400 text-sm"
            >
                ATOMS.TECH
            </Link>
        </>
    );
}
