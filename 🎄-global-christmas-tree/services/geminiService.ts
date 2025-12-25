
import { GoogleGenAI, Type } from "@google/genai";
import { MagicParams } from "../types";

// 总是动态创建实例以确保使用最新的环境变量
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChristmasWish = async (context: string, tone: 'funny' | 'heartfelt' | 'poetic'): Promise<string> => {
  try {
    const ai = getAI();
    const hasChinese = /[\u4e00-\u9fa5]/.test(context);
    
    const languageInstruction = hasChinese 
      ? "Write the wish in Chinese (Simplified)." 
      : "Write the wish in English.";

    const prompt = `Write a short, creative Christmas wish (max 15 words) suitable for a decoration tag on a Christmas tree. 
    User's Name/Context: ${context || "General holiday cheer"}.
    Tone: ${tone}.
    ${languageInstruction}
    Return ONLY the text of the wish, no quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || (hasChinese ? "圣诞快乐！" : "Merry Christmas!");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Merry Christmas!";
  }
};

export const generateMagicParamsFromAudio = async (audioBlob: Blob): Promise<{params: MagicParams, wish: string, color: string}> => {
  try {
    const ai = getAI();
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
              { inlineData: { mimeType: 'audio/wav', data: base64Data } },
              { text: "Analyze the emotion and keywords of this audio. Based on the 'vibe', generate a set of 3D decoration parameters in JSON format. If it's warm, use warm colors. If it's high energy, make it rotate fast. Also provide a transcription of the wish." }
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  wish: { type: Type.STRING },
                  color: { type: Type.STRING, description: "Main HEX color" },
                  params: {
                    type: Type.OBJECT,
                    properties: {
                      core: { type: Type.STRING, enum: ['sphere', 'box', 'octahedron', 'dodecahedron', 'icosahedron', 'torusKnot', 'composite'] },
                      hasShell: { type: Type.BOOLEAN },
                      hasRings: { type: Type.BOOLEAN },
                      hasSatellites: { type: Type.BOOLEAN },
                      hasSpikes: { type: Type.BOOLEAN },
                      scaleVar: { type: Type.NUMBER },
                      rotationSpeed: { type: Type.NUMBER },
                      metalness: { type: Type.NUMBER },
                      roughness: { type: Type.NUMBER },
                      emissiveIntensity: { type: Type.NUMBER },
                      secondaryColor: { type: Type.STRING },
                      wireframe: { type: Type.BOOLEAN }
                    }
                  }
                }
              }
            }
          });

          if (response.text) {
            resolve(JSON.parse(response.text));
          } else {
             throw new Error("Empty response");
          }
        } catch (error) {
          console.error("Magic API Error:", error);
          resolve({
            wish: "Merry Christmas!",
            color: "#EF4444",
            params: { core: 'sphere', scaleVar: 1, rotationSpeed: 0.01, metalness: 0.5, roughness: 0.5, emissiveIntensity: 1, secondaryColor: "#ffffff", hasShell: false, hasRings: true, hasSatellites: false, hasSpikes: false, wireframe: false }
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    return {
      wish: "Merry Christmas!",
      color: "#EF4444",
      params: { core: 'sphere', scaleVar: 1, rotationSpeed: 0.01, metalness: 0.5, roughness: 0.5, emissiveIntensity: 1, secondaryColor: "#ffffff", hasShell: false, hasRings: true, hasSatellites: false, hasSpikes: false, wireframe: false }
    };
  }
};

export const getFaceCoordinates = async (image: string): Promise<{xmin: number, ymin: number, xmax: number, ymax: number} | null> => {
  try {
    const ai = getAI();
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: "Detect the face in the image and return the bounding box coordinates (ymin, xmin, ymax, xmax) relative to the image size (0-1)." }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ymin: { type: Type.NUMBER },
            xmin: { type: Type.NUMBER },
            ymax: { type: Type.NUMBER },
            xmax: { type: Type.NUMBER },
          },
          required: ["ymin", "xmin", "ymax", "xmax"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Face detection failed:", error);
    return null;
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const ai = getAI();
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            contents: [
              { inlineData: { mimeType: 'audio/wav', data: base64Data } },
              { text: "Transcribe the audio exactly as spoken. Return only the text." }
            ]
          });
          resolve(response.text?.trim() || "");
        } catch (error) {
          console.error("Transcription API Error:", error);
          resolve("");
        }
      };
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    console.error("Transcription Error:", error);
    return "";
  }
};
