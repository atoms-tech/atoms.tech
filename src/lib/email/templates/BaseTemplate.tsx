import React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Link,
    Hr,
    Img,
} from '@react-email/components';

interface BaseTemplateProps {
    children: React.ReactNode;
    previewText?: string;
}

export function BaseTemplate({ children, previewText }: BaseTemplateProps) {
    return (
        <Html>
            <Head />
            <Body style={main}>
                {previewText && (
                    <Text style={preview}>{previewText}</Text>
                )}
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Img
                            src="https://atoms.tech/logo.png"
                            width="120"
                            height="40"
                            alt="ATOMS.TECH"
                            style={logo}
                        />
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        {children}
                    </Section>

                    {/* Footer */}
                    <Hr style={hr} />
                    <Section style={footer}>
                        <Text style={footerText}>
                            This email was sent by{' '}
                            <Link href="https://atoms.tech" style={link}>
                                ATOMS.TECH
                            </Link>
                            , the modern requirements management platform.
                        </Text>
                        <Text style={footerText}>
                            If you have any questions, please contact us at{' '}
                            <Link href="mailto:support@atoms.tech" style={link}>
                                support@atoms.tech
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const preview = {
    display: 'none',
    overflow: 'hidden',
    lineHeight: '1px',
    opacity: 0,
    maxHeight: 0,
    maxWidth: 0,
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const header = {
    padding: '20px 30px',
    backgroundColor: '#ffffff',
};

const logo = {
    margin: '0 auto',
};

const content = {
    padding: '0 30px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const footer = {
    padding: '0 30px',
};

const footerText = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    margin: '16px 0',
};

const link = {
    color: '#556cd6',
    textDecoration: 'underline',
};
