import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';

interface SignupApprovalEmailProps {
    fullName: string;
    email: string;
    signupLink: string;
    expiresAt?: string;
}

export const SignupApprovalEmail = ({
    fullName,
    email,
    signupLink,
    expiresAt,
}: SignupApprovalEmailProps) => (
    <Html>
        <Head />
        <Preview>Your Atoms.Tech signup request has been approved</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={box}>
                    <Text style={heading}>Welcome to Atoms.Tech! 🎉</Text>
                    <Text style={paragraph}>Hi {fullName},</Text>
                    <Text style={paragraph}>
                        Your signup request has been approved! Click the button below to
                        complete your registration and start using Atoms.Tech.
                    </Text>
                    <Link href={signupLink} style={button}>
                        Complete Signup
                    </Link>
                    {expiresAt && (
                        <Text style={paragraph}>⏰ This link expires on {expiresAt}</Text>
                    )}
                    <Hr style={hr} />
                    <Text style={footer}>
                        This email was sent to {email} because you requested access to
                        Atoms.Tech. If you didn&apos;t request access, you can safely
                        ignore this email.
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
);

const main = {
    backgroundColor: '#f4f4f4',
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    marginBottom: '64px',
    marginTop: '64px',
    maxWidth: '432px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const box = {
    padding: '0 24px 24px 24px',
};

const heading = {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '700',
    margin: '24px 0 12px 0',
    textAlign: 'center' as const,
};

const paragraph = {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '16px 0',
};

const button = {
    backgroundColor: '#2563eb',
    borderRadius: '6px',
    color: '#fff',
    display: 'block',
    fontSize: '16px',
    fontWeight: '700',
    padding: '12px 20px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    margin: '24px 0',
};

const hr = {
    borderColor: '#e5e7eb',
    margin: '24px 0',
};

const footer = {
    color: '#9ca3af',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0',
};
