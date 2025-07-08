import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, ...data } = body;

    console.log('N8N Proxy - Webhook URL:', webhookUrl);
    console.log('N8N Proxy - Request data:', data);

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Prepare the payload
    const payload = {
      timestamp: new Date().toISOString(),
      source: 'atoms-tech-agent',
      ...data,
    };

    console.log('N8N Proxy - Sending payload:', payload);

    // Forward the request to N8N webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('N8N Proxy - Response status:', response.status);
    console.log('N8N Proxy - Response statusText:', response.statusText);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.log('N8N Proxy - Error response:', errorText);
      } catch (_e) {
        console.log('N8N Proxy - Could not read error response');
      }
      
      return NextResponse.json(
        { error: `N8N request failed: ${response.statusText}. Response: ${errorText}` },
        { status: response.status }
      );
    }

    let responseData;
    try {
      responseData = await response.json();
      console.log('N8N Proxy - Success response:', responseData);
    } catch (_e) {
      // If response is not JSON, treat as text
      const responseText = await response.text();
      console.log('N8N Proxy - Non-JSON response:', responseText);
      responseData = { reply: responseText };
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('N8N proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to connect to N8N webhook: ${errorMessage}` },
      { status: 500 }
    );
  }
} 