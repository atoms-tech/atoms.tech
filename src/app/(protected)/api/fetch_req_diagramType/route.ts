import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { requirement, diagram_type } = body;

        // Validate inputs
        if (!requirement || !diagram_type) {
            return NextResponse.json(
                { error: 'Missing required fields: requirement and diagram_type' },
                { status: 400 },
            );
        }

        // Forward to Python FastAPI backend
        const response = await fetch('http://localhost:8000/api/fetch_req_diagramType', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requirement, diagram_type }),
        });

        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ error: 'Unknown error' }));
            console.error('FastAPI error:', errorData);
            return NextResponse.json(
                {
                    error: 'Failed to generate diagram from AI service',
                    details: errorData,
                },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in fetch_req_diagramType:', error);
        return NextResponse.json(
            {
                error: 'Failed to process request',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
