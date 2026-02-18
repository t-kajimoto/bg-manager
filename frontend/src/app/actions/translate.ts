'use server';

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function translateText(text: string): Promise<string> {
  if (!API_KEY) {
    console.error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
    return text;
  }

  if (!text || text.trim() === '') {
    return text;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            translation: {
              type: SchemaType.STRING,
            },
          },
        },
      },
    });

    const prompt = `Translate the following board game description into natural, engaging Japanese suitable for board game enthusiasts. 
    
    Original Text:
    ${text}
    
    Return the result in JSON format with a "translation" key.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const json = JSON.parse(response.text());
    return json.translation;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text on error
  }
}
