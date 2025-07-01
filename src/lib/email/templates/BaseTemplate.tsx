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
  title?: string;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({ 
  children, 
  title = 'ATOMS.tech' 
}) => {
  return (
    <Html>
      <Head>
        <title>{title}</title>
      </Head>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://atoms.tech/logo.png"
              width="120"
              height="40"
              alt="ATOMS.tech"
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
              © 2025 ATOMS.tech. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://atoms.tech" style={link}>
                Visit our website
              </Link>
              {' | '}
              <Link href="https://atoms.tech/contact" style={link}>
                Contact us
              </Link>
              {' | '}
              <Link href="https://atoms.tech/unsubscribe" style={link}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '20px 30px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '0 30px',
};

const footer = {
  padding: '20px 30px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};

const link = {
  color: '#556cd6',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};
