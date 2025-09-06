import { NextResponse } from 'next/server';

import { atomsApiServer } from '@/lib/atoms-api/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get('file') as File | null;
        const orgId = (form.get('orgId') as string) || '';

        if (!file || !orgId) {
            return NextResponse.json({ error: 'Missing file or orgId' }, { status: 400 });
        }

        const api = await atomsApiServer();
        const document = await api.externalDocuments.upload(file, orgId);
        return NextResponse.json(document, { status: 200 });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || 'Upload failed' },
            { status: 500 },
        );
    }
}
