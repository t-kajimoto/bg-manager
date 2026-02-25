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

    const prompt = `あなたは日本語のプロ編集者です。下の「元の文章」を、意味と事実関係は変えずに、読み手が「人が書いた」と感じる自然な日本語の要約に書き直してください。

    【厳守ルール】
    1. 文字数は必ず【200文字以内】に収めること。
    2. ゲームの「目的」と「面白いポイント」が明確に伝わるようにすること。
    3. AIっぽさ（テンプレ感、記号過多、過剰な丁寧さ、抽象語の空回り）を完全に消し、いきなり本文として自然に書き出すこと。
    4. 内容の捏造や、根拠のない数字・固有名詞の追加はしない。
    5. 「重要」「効果的」「最適」などの抽象語で押し切らず、「何がどうなるか」が伝わる具体的な表現にする。
    6. Markdown記法（太字、見出しなど）や、「」、()などの記号を多用しない。

    Original Text:
    ${text}
    
    Return the result in JSON format with a "translation" key containing the Japanese text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const json = JSON.parse(response.text());
    return json.translation;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text on error
  }
}
