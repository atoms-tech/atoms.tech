import { Button, Hr, Section, Text } from '@react-email/components';
import React from 'react';

import { BaseTemplate } from './BaseTemplate';

interface NewsletterWelcomeTemplateProps {
    email: string;
    unsubscribeUrl?: string;
}

export function NewsletterWelcomeTemplate({
    email,
    unsubscribeUrl = 'https://atoms.tech/unsubscribe',
}: NewsletterWelcomeTemplateProps) {
    return (
        <BaseTemplate previewText="Welcome to ATOMS.TECH Newsletter!">
            <Text style={heading}>Welcome to ATOMS.TECH Newsletter! 🎉</Text>

            <Text style={paragraph}>
                Thank you for subscribing to our newsletter! We&apos;re excited
                to have you join our community of requirements management
                professionals.
            </Text>

            <Section style={benefitsSection}>
                <Text style={subheading}>What you&apos;ll receive:</Text>
                <Text style={benefitItem}>
                    📊 Product updates and new features
                </Text>
                <Text style={benefitItem}>
                    💡 Best practices for requirements management
                </Text>
                <Text style={benefitItem}>
                    🔧 Tips and tricks to improve your workflow
                </Text>
                <Text style={benefitItem}>📈 Industry insights and trends</Text>
                <Text style={benefitItem}>
                    🎯 Exclusive content and early access
                </Text>
            </Section>

            <Section style={actionSection}>
                <Button
                    href="https://atoms.tech/dashboard"
                    style={primaryButton}
                >
                    Explore ATOMS.TECH
                </Button>
            </Section>

            <Hr style={hr} />

            <Section style={footerSection}>
                <Text style={footerText}>
                    You&apos;re receiving this email because you subscribed to
                    our newsletter with the email address: {email}
                </Text>
                <Text style={footerText}>
                    Don&apos;t want to receive these emails? You can{' '}
                    <a href={unsubscribeUrl} style={unsubscribeLink}>
                        unsubscribe here
                    </a>
                    .
                </Text>
            </Section>
        </BaseTemplate>
    );
}

// Styles
const heading = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333333',
    margin: '0 0 20px 0',
    textAlign: 'center' as const,
};

const paragraph = {
    fontSize: '16px',
    color: '#333333',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
};

const subheading = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333333',
    margin: '0 0 15px 0',
};

const benefitsSection = {
    backgroundColor: '#f8f9fa',
    padding: '25px',
    borderRadius: '8px',
    margin: '25px 0',
};

const benefitItem = {
    fontSize: '16px',
    color: '#333333',
    margin: '8px 0',
    paddingLeft: '10px',
};

const actionSection = {
    textAlign: 'center' as const,
    margin: '30px 0',
};

const primaryButton = {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '16px',
    display: 'inline-block',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '30px 0',
};

const footerSection = {
    margin: '20px 0',
};

const footerText = {
    fontSize: '14px',
    color: '#666666',
    lineHeight: '1.5',
    margin: '10px 0',
    textAlign: 'center' as const,
};

const unsubscribeLink = {
    color: '#007bff',
    textDecoration: 'underline',
};
