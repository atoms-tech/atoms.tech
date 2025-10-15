import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
export const resend_from_email = process.env.RESEND_FROM_EMAIL || 'hello@atoms.tech';
export const resend_receive_email =
    process.env.RESEND_RECEIVE_EMAIL || 'noreply@atoms.tech';
