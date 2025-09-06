import { NextResponse } from 'next/server';
import { atomsApiServer } from '@/lib/atoms-api/server';

export const runtime = 'nodejs';

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const api = await atomsApiServer();
    await api.externalDocuments.remove(id);
    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 500 });
  }
}
