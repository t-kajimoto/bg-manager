const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyBnIWlWxivqEnWIWfFgrdQUf4GYZS6j4zU";

async function test() {
  console.log("Testing Gemini 2.5 Flash Lite with JSON Schema...");

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          translation: {
            type: "STRING",
          },
        },
      },
    },
  });

  const prompt = `Translate the following to Japanese: "Hello world"`;

  try {
    const result = await model.generateContent(prompt);
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
