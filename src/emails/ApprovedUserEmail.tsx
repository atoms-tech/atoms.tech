import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import tailwindConfig from '@tailwind-config';

import Footer from './_components/Footer';

interface ApprovedUserEmailProps {
    name: string;
}

ApprovedUserEmail.PreviewProps = {
    name: 'John',
};

export default function ApprovedUserEmail({ name }: ApprovedUserEmailProps) {
    return (
        <Tailwind config={tailwindConfig}>
            <Html>
                <Head />
                <Body>
                    <Container className="mx-auto text-center my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
                        <Heading className="text-xl font-serif font-bold">
                            Welcome to Atoms
                        </Heading>
                        <Text className="font-serif text-left text-base">
                            Hey {name},
                        </Text>
                        <Text className="font-serif text-left text-base">
                            You are now able to access all that Atom has to offer. By
                            clicking the Get Started button below, you will be able to
                            start the onboarding process.
                        </Text>
                        <Button
                            className="block rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white font-serif text-base"
                            href="https://atoms.tech/home/user"
                        >
                            Get started
                        </Button>
                        <Footer />
                    </Container>
                </Body>
            </Html>
        </Tailwind>
    );
}
