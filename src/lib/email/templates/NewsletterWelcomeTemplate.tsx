import React from 'react';
import { Text, Heading, Section, Button } from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';
import { NewsletterData } from '../emailService';

export const NewsletterWelcomeTemplate: React.FC<NewsletterData> = ({
  email,
  name,
}) => {
  return (
    <BaseTemplate title="Welcome to ATOMS.tech Newsletter">
      <Heading style={h1}>Welcome to ATOMS.tech!</Heading>
      
      <Section style={section}>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hello!'}
        </Text>
        <Text style={text}>
          Thank you for subscribing to the ATOMS.tech newsletter! We're excited to have you 
          join our community of requirements management professionals.
        </Text>
      </Section>

      <Section style={section}>
        <Text style={text}>
          Here's what you can expect from our newsletter:
        </Text>
        <Text style={listItem}>
          • Latest product updates and feature announcements
        </Text>
        <Text style={listItem}>
          • Best practices for requirements management
        </Text>
        <Text style={listItem}>
          • Industry insights and trends
        </Text>
        <Text style={listItem}>
          • Exclusive tips and tutorials
        </Text>
      </Section>

      <Section style={section}>
        <Text style={text}>
          Ready to get started? Explore our platform and discover how ATOMS.tech can 
          streamline your requirements management process.
        </Text>
        <Button style={button} href="https://atoms.tech/dashboard">
          Get Started
        </Button>
      </Section>

      <Section style={section}>
        <Text style={text}>
          If you have any questions or need assistance, don't hesitate to reach out to 
          our support team. We're here to help!
        </Text>
        <Text style={text}>
          Best regards,<br />
          The ATOMS.tech Team
        </Text>
      </Section>
    </BaseTemplate>
  );
};

// Styles
const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
};

const section = {
  margin: '24px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 10px 0',
};

const listItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 8px 0',
  paddingLeft: '10px',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 0',
  margin: '20px 0',
};
