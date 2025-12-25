import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Helper to convert URL to Base64 (for analysis of remote images)
export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const analyzeImage = async (base64Data: string, prompt: string = "Describe this image in detail."): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  
  // Re-initialize to ensure we use the latest key
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from context
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

interface GenerateImageOptions {
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  usePro?: boolean;
}

export const generateImage = async (prompt: string, options: GenerateImageOptions = {}): Promise<{ base64: string, mimeType: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  
  const ai = new GoogleGenAI({ apiKey });
  const { aspectRatio = '1:1', usePro = false } = options;

  const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  // Pro model supports explicit size configuration
  const imageConfig: any = {
    aspectRatio: aspectRatio,
  };

  if (usePro) {
    imageConfig.imageSize = '2K'; // Default to high quality for Pro
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: imageConfig
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Options: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data generated");
    }
    return base64Audio;
  } catch (error) {
    console.error("Speech generation failed:", error);
    throw error;
  }
};