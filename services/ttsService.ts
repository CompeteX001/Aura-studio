
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { VoiceName, Emotion, Language, LanguagePolicy, ModulationPreset } from "../types";

export class TTSService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing from environment.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async naturalizeScript(text: string, language: Language): Promise<string> {
    const prompt = `
      Rewrite the following ${language} text into ultra-realistic, conversational "Hinglish" style. 
      Use natural fillers like "haan...", "dekho...", "actually...", "matlab...", "waise...", "thoda...".
      Use punctuation like "—" or "..." for natural pauses.
      
      Example:
      Input: "Aaj hum baat karenge ek mahatvapurn vishay par."
      Output: "haan... dekho, actually yeh cheez thodi alag hai — matlab, log samajhte kuch aur hain..."
      
      Input: "${text}"
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });
      return response.text || text;
    } catch (error) {
      console.error("Script Improvement Error:", error);
      return text;
    }
  }

  async generateSpeech(
    text: string, 
    voice: VoiceName, 
    emotion: Emotion,
    language: Language,
    languagePolicy: LanguagePolicy,
    personaPrompt: string,
    pitch: number, // -50 to 50
    speed: number, // 0.5 to 2.0
    modulation: ModulationPreset
  ): Promise<string> {
    const model = "gemini-2.5-flash-preview-tts";
    
    const hasExpressions = /\[.*\]/.test(text);
    const v3Activation = hasExpressions 
      ? "ACTIVATE V3+ CINEMATIC MODE: The text contains performance markers. Render these with absolute human fidelity. " 
      : "";

    // Pitch instruction
    const pitchDesc = pitch < 0 ? "Significantly LOWER the vocal pitch for a deeper bass profile. " : 
                      pitch > 0 ? "RAISE the vocal pitch for a lighter, more youthful tone. " : "";
    
    // Speed instruction
    const speedDesc = `Maintain a steady pace of ${speed}x normal speed. `;

    // Modulation instructions
    let modulationDesc = "";
    if (modulation === ModulationPreset.Deep) modulationDesc = "Emphasize chest resonance and thick bass textures. ";
    if (modulation === ModulationPreset.Light) modulationDesc = "Keep the delivery light, airy, and soft-spoken. ";
    if (modulation === ModulationPreset.Authoritative) modulationDesc = "Deliver with absolute conviction, sharp articulation, and a commanding presence. ";
    if (modulation === ModulationPreset.Playful) modulationDesc = "Add a rhythmic, bouncy, and smiling intonation to the speech. ";

    const hyperRealBase = "Apply High-Definition vocal textures. Strong proximity effect. Natural vocal grain, micro-hesitations, and detailed breath-work. ";
    const personality = `Character Profile: ${personaPrompt}. `;
    const emotionContext = emotion !== Emotion.Neutral ? `Primary Emotional State: ${emotion.toLowerCase()}. ` : "";
    
    const langContext = languagePolicy === LanguagePolicy.Strict 
      ? `STRICT LANGUAGE: Deliver entirely in ${language}. `
      : `Natural: Maintain ${language} flow. `;
    
    const finalPrompt = `${v3Activation}${hyperRealBase}${pitchDesc}${speedDesc}${modulationDesc}${personality}${emotionContext}${langContext}"${text}"`;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: finalPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        throw new Error("No audio data received from Gemini API");
      }
      return audioData;
    } catch (error) {
      console.error("TTS Generation Error:", error);
      throw error;
    }
  }
}

export const ttsService = new TTSService();
