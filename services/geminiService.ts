import { GoogleGenAI, Type } from "@google/genai";
import { SEOAnalysis } from "../types.ts";

export const analyzeDomain = async (domain: string): Promise<SEOAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the domain "${domain}" for SEO metrics. Estimate its Domain Authority (1-100), identify its primary niche, and provide a 1-sentence summary of its content profile. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            da: { type: Type.NUMBER, description: 'Domain Authority score' },
            niche: { type: Type.STRING, description: 'SEO Niche' },
            summary: { type: Type.STRING, description: 'Brief site summary' }
          },
          required: ['da', 'niche', 'summary']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      da: result.da || 20,
      niche: result.niche || 'General',
      summary: result.summary || 'A standard web property.'
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return { da: 15, niche: 'Uncategorized', summary: 'Verification pending.' };
  }
};