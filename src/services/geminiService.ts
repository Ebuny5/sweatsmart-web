import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    confidence: {
      type: Type.NUMBER,
      description: "A confidence score from 0 to 100 for the overall analysis."
    },
    severity: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.NUMBER,
          description: "A severity score from 1 to 10."
        },
        assessment: {
          type: Type.STRING,
          description: "A descriptive assessment (e.g., 'Mild', 'Moderate', 'Severe', 'Very Severe')."
        }
      },
      required: ['level', 'assessment']
    },
    sweatGlandActivity: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.NUMBER,
          description: "An activity level from 0 to 100, representing the percentage of active sweat glands detected."
        },
        assessment: {
          type: Type.STRING,
          description: "A descriptive assessment (e.g., 'Normal', 'Active', 'Highly Active')."
        }
      },
      required: ['level', 'assessment']
    },
    moistureSource: {
      type: Type.STRING,
      description: "The suspected source of the moisture. Must be one of: 'Hyperhidrosis', 'Exertional Sweat', 'External Moisture', 'Uncertain'."
    },
    detectedTriggers: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      },
      description: "An array of potential triggers. If none, provide a default like ['Unknown']."
    },
    treatmentRecommendations: {
      type: Type.OBJECT,
      properties: {
        primary: {
          type: Type.STRING,
          description: "The most suitable primary treatment option."
        },
        alternative: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "An array of alternative treatment options."
        }
      },
      required: ['primary', 'alternative']
    },
    analysisNotes: {
        type: Type.STRING,
        description: "A brief note explaining the reasoning, especially if the analysis is ambiguous. If sensor data is provided, your note MUST reference it. For example, if an external water source is suspected, this note MUST mention it. If confident, state that."
    }
  },
  required: ['confidence', 'severity', 'sweatGlandActivity', 'moistureSource', 'detectedTriggers', 'treatmentRecommendations', 'analysisNotes']
};


export const analyzeImage = async (base64Image: string, mimeType: string, hrData: number | null, gsrData: number | null): Promise<AnalysisResult> => {
  let prompt = `You are a sophisticated AI model called "SweatSmart" specializing in the analysis of hyperhidrosis from images of palms, feet, and soles. Your task is to analyze the provided image AND the accompanying sensor data to classify the moisture source.`;
  
  if (hrData !== null || gsrData !== null) {
    const hrContext = hrData !== null 
        ? `- Heart Rate at time of photo: ${hrData} bpm (${hrData > 100 ? 'Consider this an elevated heart rate, likely due to exertion.' : 'Consider this a resting or near-resting state.'})` 
        : '';
    const gsrContext = gsrData !== null 
        ? `- GSR (Skin Conductance) at time of photo: ${gsrData} µS (${gsrData > 2.5 ? 'This is a high reading, indicating significant sweat gland activity.' : 'This is a low/normal reading.'})` 
        : '';

    prompt += `
  
  SENSOR DATA CONTEXT:
  ${hrContext}
  ${gsrContext}
  - Motion Data: Assume no significant movement was detected unless implied by an elevated heart rate.
  
  CRITICAL INSTRUCTION: Use the sensor data as your primary context. 
  - A high GSR reading combined with a RESTING heart rate (< 100bpm) is a very strong indicator of primary hyperhidrosis. In this case, 'moistureSource' should be 'Hyperhidrosis' and confidence should be high.
  - A high GSR reading combined with an ELEVATED heart rate (> 100bpm) is a strong indicator of 'Exertional Sweat'.
  - A low GSR reading (< 2.5µS) indicates minimal sweat activity. If the image shows moisture, it's highly likely to be 'External Moisture'.
  Analyze the image to confirm the presence of moisture and provide your final assessment.`;
  } else {
    prompt += `
    
  CRITICAL INSTRUCTION: Your primary goal is to determine the source of moisture on the skin based on the image alone. This is the most important part of your analysis. Pay close attention to visual cues to differentiate between:
  - **Hyperhidrosis Sweat:** Originates from pores without an obvious cause like exercise. It appears as distinct, tiny beads or a sheen following skin lines. The skin looks glistening and clammy. This is your primary focus for a positive diagnosis.
  - **Exertional Sweat:** Caused by physical activity. While it's sweat, it is not necessarily hyperhidrosis. The presentation might be similar, but it's a normal physiological response. If the context is unknown, note this possibility.
  - **External Moisture:** This includes water, lotions, oils, etc. It often coats the surface more uniformly, shows drip marks, has larger, irregular droplets not associated with pores, or reflects light like a film.`;
  }
  
  prompt += `
  
  Based on your analysis, you MUST:
  1.  Set the 'moistureSource' field to one of: 'Hyperhidrosis', 'Exertional Sweat', 'External Moisture', or 'Uncertain'.
  2.  If you suspect 'External Moisture', you MUST lower the confidence score significantly (e.g., below 40) and set severity to a low score (e.g., 1). Your 'analysisNotes' MUST state that an external source is suspected.
  3.  If you are confident the moisture is from 'Hyperhidrosis', provide a high confidence score and a corresponding severity assessment.
  4.  If you suspect 'Exertional Sweat' but cannot be sure it's not hyperhidrosis, you can provide a moderate confidence score and note the ambiguity in 'analysisNotes'.
  
  Provide your final, detailed assessment in a valid JSON format that adheres to the provided schema. Do not include any text, markdown, or code block formatting before or after the JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result as AnalysisResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get analysis from the AI model.");
  }
};