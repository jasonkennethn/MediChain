import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No audio file provided in the request' },
        { status: 400 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.error('GROQ_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Prepare FormData for Groq API
    const groqFormData = new FormData();
    groqFormData.append('file', file, 'audio.webm'); // Name is required by some APIs
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('response_format', 'json');

    // Make request to Groq OpenAI compatible endpoint
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to transcribe audio via Groq' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error('Transcription route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
