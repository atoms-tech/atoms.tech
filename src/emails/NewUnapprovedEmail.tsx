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

interface NewUnapprovedEmailProps {
    name: string;
    email: string;
}

NewUnapprovedEmail.PreviewProps = {
    name: 'John',
    email: 'john@gmail.com',
};

export default function NewUnapprovedEmail({ name, email }: NewUnapprovedEmailProps) {
    return (
        <Tailwind config={tailwindConfig}>
            <Html>
                <Head />
                <Body>
                    <Container className="mx-auto text-center my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
                        <Heading className="text-xl font-serif font-bold">
                            You Have A New Unapproved User
                        </Heading>
                        <Text className="font-serif text-left text-base">
                            <strong>{name}</strong> has signed up with the email &quot;
                            <strong>{email}</strong>&quot;. By clicking the button below,
                            you will be able to approve them.
                        </Text>
                        <Button
                            className="block rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white font-serif text-base"
                            href="https://atoms.tech/admin"
                        >
                            Go To Admin Page
                        </Button>
                        <Footer />
                    </Container>
                </Body>
            </Html>
        </Tailwind>
    );
}
