import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

export async function POST(request: NextRequest) {
    console.log('request');

    const supabase = await createClient();

    const { diagramData, diagramId } = await request.json();

    // console.log("diagramData", diagramData, diagramId);

    const { data, error } = await supabase.from('excalidraw_diagrams').upsert({
        id: diagramId,
        diagram_data: diagramData,
        updated_at: new Date().toISOString(),
    });

    if (error) {
        console.log('error', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
}
