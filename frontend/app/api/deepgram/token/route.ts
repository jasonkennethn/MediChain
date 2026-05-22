import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Deepgram API key not found' }, { status: 500 });
    }

    // Since the provided API key does not have 'keys:write' scope to generate temporary
    // tokens, we will return the primary key for the frontend to use.
    return NextResponse.json({ key: apiKey });
  } catch (error: any) {
    console.error('Deepgram token error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
