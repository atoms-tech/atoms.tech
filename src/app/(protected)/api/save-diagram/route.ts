import { NextRequest, NextResponse } from 'next/server';

import { atomsApiServer } from '@/lib/atoms-api/server';
import type { TablesInsert } from '@/types/base/database.types';

export async function POST(request: NextRequest) {
    console.log('request');

    const { diagramData, diagramId } = await request.json();

    // console.log("diagramData", diagramData, diagramId);

    const api = await atomsApiServer();
    // Use diagrams domain upsert
    const payload: TablesInsert<'excalidraw_diagrams'> = {
        id: diagramId,
        diagram_data: diagramData,
        updated_at: new Date().toISOString(),
    };
    const result = await api.diagrams.upsert(payload);
    return NextResponse.json({ data: result }, { status: 200 });
}
