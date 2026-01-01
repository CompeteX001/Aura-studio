
export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export enum Emotion {
  Neutral = 'Neutral',
  Cheerful = 'Cheerful',
  Sad = 'Sad',
  Excited = 'Excited',
  Angry = 'Angry',
  Whispering = 'Whispering',
  Shouting = 'Shouting',
  Calm = 'Calm'
}

export enum Language {
  English = 'English',
  Hindi = 'Hindi'
}

export enum LanguagePolicy {
  Auto = 'Auto (Natural)',
  Strict = 'Strict Override'
}

export enum ModulationPreset {
  None = 'None',
  Deep = 'Deep & Heavy',
  Light = 'Light & Airy',
  Authoritative = 'Authoritative',
  Playful = 'Playful'
}

export interface VoicePersona {
  id: string;
  name: string;
  baseVoice: VoiceName;
  description: string;
  bestFor: string;
  color: string;
  prompt: string;
  category: 'Standard' | 'Ultra-Real Hindi';
}

export interface TTSHistoryItem {
  id: string;
  text: string;
  voiceName: string;
  emotion: Emotion;
  language: Language;
  audioUrl: string;
  timestamp: number;
}
