import { Resend } from 'resend';

// Lazily create the Resend client to avoid build-time evaluation errors
// when RESEND_API_KEY may not be set during static analysis.
export function getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('Missing RESEND_API_KEY');
    }
    return new Resend(apiKey);
}

export const resend_from_email = process.env.RESEND_FROM_EMAIL || 'hello@atoms.tech';
export const resend_receive_email =
    process.env.RESEND_RECEIVE_EMAIL || 'noreply@atoms.tech';
