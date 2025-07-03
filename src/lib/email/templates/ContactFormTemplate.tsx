import { Button, Section, Text } from '@react-email/components';
import React from 'react';

import { BaseTemplate } from './BaseTemplate';

interface ContactFormTemplateProps {
    name: string;
    email: string;
    subject: string;
    message: string;
    submittedAt?: string;
}

export function ContactFormTemplate({
    name,
    email,
    subject,
    message,
    submittedAt = new Date().toLocaleString(),
}: ContactFormTemplateProps) {
    return (
        <BaseTemplate previewText={`New contact form submission from ${name}`}>
            <Text style={heading}>New Contact Form Submission</Text>

            <Section style={infoSection}>
                <Text style={label}>Name:</Text>
                <Text style={value}>{name}</Text>

                <Text style={label}>Email:</Text>
                <Text style={value}>{email}</Text>

                <Text style={label}>Subject:</Text>
                <Text style={value}>{subject}</Text>

                <Text style={label}>Submitted:</Text>
                <Text style={value}>{submittedAt}</Text>
            </Section>

            <Section style={messageSection}>
                <Text style={label}>Message:</Text>
                <Text style={messageText}>{message}</Text>
            </Section>

            <Section style={actionSection}>
                <Button
                    href={`mailto:${email}?subject=Re: ${subject}`}
                    style={replyButton}
                >
                    Reply to {name}
                </Button>
            </Section>
        </BaseTemplate>
    );
}

// Styles
const heading = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333333',
    margin: '0 0 20px 0',
};

const infoSection = {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
};

const label = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666666',
    margin: '10px 0 5px 0',
};

const value = {
    fontSize: '16px',
    color: '#333333',
    margin: '0 0 15px 0',
};

const messageSection = {
    margin: '20px 0',
};

const messageText = {
    fontSize: '16px',
    color: '#333333',
    lineHeight: '1.6',
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap' as const,
};

const actionSection = {
    textAlign: 'center' as const,
    margin: '30px 0',
};

const replyButton = {
    backgroundColor: '#007bff',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 'bold',
    display: 'inline-block',
};
