
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWebsiteForDA = async (domain: string): Promise<{ da: number, niche: string, summary: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this domain for approximate SEO metrics: ${domain}. Focus on Domain Authority (DA) 1-100, Niche, and a 1-sentence content quality summary.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            da: { type: Type.NUMBER, description: 'Estimated Domain Authority (1-100)' },
            niche: { type: Type.STRING, description: 'Main category of the site' },
            summary: { type: Type.STRING, description: 'Brief content summary' }
          },
          required: ['da', 'niche', 'summary']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback logic
    return { 
      da: Math.floor(Math.random() * 40) + 10, 
      niche: 'General', 
      summary: 'Automated analysis unavailable. Using default estimates.' 
    };
  }
};
