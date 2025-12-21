
import { GoogleGenAI, Type } from "@google/genai";
import { Drop, GlobalStats } from "../types";

export const analyzeDataWithGemini = async (drops: Drop[], stats: GlobalStats[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Truncate data if too large to avoid token limits
  const summaryData = {
    totalDrops: drops.length,
    totalUniqueIps: stats.length,
    topTenIps: stats.sort((a, b) => b.count - a.count).slice(0, 10),
    dropSamples: drops.slice(0, 5).map(d => ({ id: d.id, time: d.time, count: d.rawValues.length }))
  };

  const prompt = `
    I have log data from a system called "DROP". 
    Summary Data: ${JSON.stringify(summaryData)}
    
    Task: 
    1. Identify any potential anomalies in the IP patterns or numeric values.
    2. Suggest if any specific IPs look suspicious due to high frequency.
    3. Provide a brief professional summary of the traffic observed.
    
    Keep the tone professional and the response formatted in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to perform AI analysis. Check your connection or API key status.";
  }
};
