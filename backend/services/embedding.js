import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.Gemini });

/**
 * Generate a 768-dimensional embedding using Gemini embedding-001.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function generateEmbedding(text) {
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
  });
  return result.embeddings[0].values;
}
