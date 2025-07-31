import { render } from '@react-email/render';
import { NextRequest, NextResponse } from 'next/server';

import NewUnapprovedEmail from '@/emails/NewUnapprovedEmail';
import { resend, resend_from_email, resend_receive_email } from '@/lib/services/resend';

export async function POST(request: NextRequest) {
    try {
        const { email, name } = await request.json();
        if (
            typeof email !== 'string' ||
            typeof name !== 'string' ||
            email.trim() === '' ||
            name.trim() === ''
        ) {
            throw new Error('Invalid Email or Name');
        }

        const html = await render(NewUnapprovedEmail({ name, email }));

        const { data, error } = await resend.emails.send({
            from: `Atoms Tech <${resend_from_email}>`,
            to: resend_receive_email,
            subject: 'New Unapproved User',
            html: html,
        });

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
