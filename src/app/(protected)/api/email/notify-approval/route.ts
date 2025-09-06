import { render } from '@react-email/render';
import { NextRequest, NextResponse } from 'next/server';

import ApprovedUserEmail from '@/emails/ApprovedUserEmail';
import { getResend, resend_from_email } from '@/lib/services/resend';

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

        const html = await render(ApprovedUserEmail({ name }));

        const resend = getResend();
        const { data, error } = await resend.emails.send({
            from: `Atoms Tech <${resend_from_email}>`,
            to: email,
            subject: 'Get Started With Atoms.tech',
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
