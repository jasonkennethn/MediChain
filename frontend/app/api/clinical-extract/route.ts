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
    const apiKey = process.env.GEMINI_API_KEY;
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
      The conversation may be multilingual (English, Hindi, Kannada, Tamil, Telugu, Malayalam) or code-mixed.
      
      Current Clinical State:
      ${JSON.stringify(currentState, null, 2)}
      
      Recent Transcript:
      ${transcript}
      
      Instructions:
      1. Analyze the new transcript and extract any newly mentioned symptoms, diagnosis, prescriptions, follow-up advice, or tests.
      2. Merge this new information with the "Current Clinical State".
      3. Return the updated JSON state exactly matching the schema. 
      4. Ensure medicines have a name, boolean flags for morning/afternoon/night, and an integer for days. If not explicitly mentioned, assume standard values (e.g. 1 day, or what's reasonable) or leave false.
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
