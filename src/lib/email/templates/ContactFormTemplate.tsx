import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { BaseTemplate } from './BaseTemplate';
import { ContactFormData } from '../emailService';

export const ContactFormTemplate: React.FC<ContactFormData> = ({
  name,
  email,
  subject,
  message,
}) => {
  return (
    <BaseTemplate title={`Contact Form: ${subject}`}>
      <Heading style={h1}>New Contact Form Submission</Heading>
      
      <Section style={section}>
        <Text style={text}>
          <strong>From:</strong> {name} ({email})
        </Text>
        <Text style={text}>
          <strong>Subject:</strong> {subject}
        </Text>
        <Text style={text}>
          <strong>Message:</strong>
        </Text>
        <Text style={messageText}>
          {message}
        </Text>
      </Section>

      <Section style={section}>
        <Text style={text}>
          Please respond to this inquiry promptly. You can reply directly to this email 
          to reach the sender at {email}.
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

const messageText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '10px 0',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderLeft: '4px solid #007bff',
  borderRadius: '4px',
};
