import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Define the expected output schema for Gemini
const clinicalStateSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    symptoms: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of symptoms mentioned by the patient."
    },
    diagnosis: {
      type: SchemaType.STRING,
      description: "The doctor's diagnosis, if mentioned."
    },
    prescription_data: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: "Name of the medicine" },
          morning: { type: SchemaType.BOOLEAN, description: "Take in the morning" },
          afternoon: { type: SchemaType.BOOLEAN, description: "Take in the afternoon" },
          night: { type: SchemaType.BOOLEAN, description: "Take at night" },
          days: { type: SchemaType.INTEGER, description: "Number of days to take the medicine" }
        },
        required: ["name", "morning", "afternoon", "night", "days"]
      },
      description: "List of medicines prescribed by the doctor."
    },
    follow_up_instructions: {
      type: SchemaType.STRING,
      description: "Any follow up instructions or advice given to the patient."
    },
    tests_advised: {
      type: SchemaType.STRING,
      description: "Any medical tests advised by the doctor."
    }
  },
  required: ["symptoms", "diagnosis", "prescription_data", "follow_up_instructions", "tests_advised"]
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const configRes = await fetch(`${apiBaseUrl}/api/config/keys/`, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!configRes.ok) {
      return NextResponse.json({ error: 'Unauthorized or failed to fetch keys from backend' }, { status: 401 });
    }

    const { gemini_api_key } = await configRes.json();
    const apiKey = gemini_api_key;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not found' }, { status: 500 });
    }

    const { transcript, currentState } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: clinicalStateSchema,
        temperature: 0.1, // Low temperature for consistent JSON
      },
    });

    const prompt = `
      You are an expert AI clinical medical scribe. Your task is to update the patient's clinical state based on the latest transcript of a doctor-patient conversation.
      
      Current Clinical State:
      ${JSON.stringify(currentState, null, 2)}
      
      Recent Transcript:
      ${transcript}
      
      Instructions:
      1. The recent transcript may be in English or any Indian language (such as Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali) or a code-mixed combination (e.g., Hinglish, Kanglish). You must accurately understand all these languages and correctly translate and merge the clinical details into the final state in professional, standardized clinical English.
      2. Update the "diagnosis" field as a detailed, pointwise paragraph explaining the provisional diagnosis. Neatly list out the symptoms, durations, and any other relevant observations using clear bullet points (e.g. "- Chief Symptom (duration: X days): details"). Ensure it is structured neatly as a point-by-point markdown/text list within the diagnosis field so the doctor can read the complete context easily.
      3. Extract any newly mentioned symptoms and add them to the "symptoms" array.
      4. Extract any prescribed medicines and append/update them in "prescription_data". Ensure each medicine contains a clean name, timing boolean flags (morning/afternoon/night), and duration (days). If timings/duration are not explicitly specified, fill them logically.
      5. Extract any tests advised or follow-up instructions and merge them into "tests_advised" and "follow_up_instructions" respectively.
      6. Return the updated JSON state exactly matching the schema, ensuring valid JSON formatting.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the JSON back to ensure it's valid before sending to frontend
    const updatedState = JSON.parse(text);

    return NextResponse.json(updatedState);
  } catch (error: any) {
    console.error('Gemini extraction error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
