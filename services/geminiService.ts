import { GoogleGenAI } from "@google/genai";
import { GroundingResult } from "../types";

// Initialize Gemini
// NOTE: We assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getEstimateAndInfo = async (
  serviceName: string, 
  location: string, 
  description: string
): Promise<{ estimate: string; info: string; mapData: GroundingResult | null }> => {
  if (!process.env.API_KEY) {
    return {
      estimate: "Consultar con profesional",
      info: "Servicio de IA no disponible (Falta API Key).",
      mapData: null
    };
  }

  try {
    // We use two models/calls here to leverage specific tools.
    
    // 1. Price Estimate using Search Grounding
    const searchPrompt = `Soy un usuario en Argentina, ${location}. Necesito un servicio de ${serviceName}. 
    El problema es: "${description}".
    Busca precios actuales de mano de obra en Argentina para esto.
    Dame UNICAMENTE un rango de precios estimado en Pesos Argentinos (ARS). 
    Sé breve. Ejemplo: "$15.000 - $30.000 ARS".`;

    const searchResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const estimate = searchResponse.text?.trim() || "A convenir";

    // 2. Location Context using Maps Grounding
    // This verifies the address exists and finds nearby relevant hardware stores or landmarks
    const mapPrompt = `El usuario está en: ${location}. 
    Verifica si esta ubicación existe en Argentina. 
    Lista 2 ferreterías o tiendas de materiales cercanas que podrían servir para un trabajo de ${serviceName}.
    Formato breve en español.`;

    const mapResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: mapPrompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    // Extract grounding chunks for the UI
    const chunks = mapResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const mapSources: Array<{ title: string; uri: string }> = [];
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          mapSources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
        if (chunk.maps?.uri && chunk.maps?.title) {
          mapSources.push({ title: chunk.maps.title, uri: chunk.maps.uri });
        }
      });
    }

    return {
      estimate,
      info: mapResponse.text || "Ubicación procesada.",
      mapData: {
        text: mapResponse.text || "",
        sources: mapSources
      }
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      estimate: "A cotizar en visita",
      info: "No pudimos conectar con el asistente inteligente.",
      mapData: null
    };
  }
};