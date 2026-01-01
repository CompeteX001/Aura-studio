
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { VoiceName, Emotion, Language, LanguagePolicy, TTSHistoryItem, VoicePersona, ModulationPreset } from './types';
import { ttsService } from './services/ttsService';
import { decodeBase64, pcmToAudioBuffer, createWavFile } from './utils/audioUtils';

const PERSONAS: (VoicePersona & { lang: Language })[] = [
  // HINDI VOICES
  {
    id: 'creator-v3',
    lang: Language.Hindi,
    name: 'CREATOR (Deep Bass V3+)',
    baseVoice: VoiceName.Charon,
    description: 'Tech Influencer / Deep Studio Bass',
    bestFor: 'Viral Shorts, Hooks, Cinematic Authority',
    color: 'bg-gradient-to-r from-blue-600 to-indigo-900',
    category: 'Ultra-Real Hindi',
    prompt: `ULTRA-REAL PERFORMANCE: An energetic, articulate Indian male voice with a VERY LOW PITCH and HEAVY BASS-DRIVEN MASCULINE RESONANCE. Deliver with cinematic authority and a rich, velvety chest-voice. High-end studio quality.`
  },
  {
    id: 'ananya-v3',
    lang: Language.Hindi,
    name: 'ANANYA (Soft Storyteller)',
    baseVoice: VoiceName.Kore,
    description: 'Gentle / Emotional / Calm',
    bestFor: 'Storytelling, Meditation, Documentaries',
    color: 'bg-gradient-to-r from-pink-500 to-rose-400',
    category: 'Ultra-Real Hindi',
    prompt: `An elegant, soft-spoken Indian female voice. Calm, gentle, and emotionally expressive. Perfect for narrative storytelling and audiobooks. High clarity and warmth.`
  },
  {
    id: 'ishan-v3',
    lang: Language.Hindi,
    name: 'ISHAN (Smooth Documentary)',
    baseVoice: VoiceName.Charon,
    description: 'Professional / Deep / Serious',
    bestFor: 'Explainers, News, Corporate',
    color: 'bg-gradient-to-r from-slate-600 to-slate-800',
    category: 'Ultra-Real Hindi',
    prompt: `A deep, authoritative Indian male voice. Professional narration style, measured pacing, and grounded resonance. Excellent for historical documentaries and news.`
  },
  {
    id: 'kavya-v3',
    lang: Language.Hindi,
    name: 'KAVYA (Sharp Professional)',
    baseVoice: VoiceName.Kore,
    description: 'Confident / Articulate / Fast',
    bestFor: 'Podcasts, Tutorials, Corporate Ads',
    color: 'bg-gradient-to-r from-teal-500 to-emerald-600',
    category: 'Ultra-Real Hindi',
    prompt: `A confident, articulate Indian female voice. Fast-paced, professional, and sharp. Great for educational content and modern podcasts.`
  },
  {
    id: 'rahul-v3',
    lang: Language.Hindi,
    name: 'RAHUL (Conversational)',
    baseVoice: VoiceName.Puck,
    description: 'Youthful / Friendly / Natural',
    bestFor: 'Vlogs, Social Media, Casual Chat',
    color: 'bg-gradient-to-r from-orange-400 to-amber-600',
    category: 'Ultra-Real Hindi',
    prompt: `A youthful, energetic Indian male voice. Very conversational, friendly tone, and natural inflections. Sounds like a relatable social media creator.`
  },
  {
    id: 'doctor-v3',
    lang: Language.Hindi,
    name: 'CRAZY DOCTOR (Nasal V3+)',
    baseVoice: VoiceName.Puck,
    description: 'Cartoonish / Nasal / Serious',
    bestFor: 'Comedy, Storytelling, Eccentric Roles',
    color: 'bg-gradient-to-r from-emerald-400 to-cyan-600',
    category: 'Ultra-Real Hindi',
    prompt: `CARTOONISH PERFORMANCE: A highly eccentric, nasally Indian male voice. Sounds like talking through the nose with air restricted. The tone is an absurdly "serious" crazy doctor. MANIC ENERGY.`
  },
  {
    id: 'srk-v3',
    lang: Language.Hindi,
    name: 'SHAH RUKH (Iconic V3+)',
    baseVoice: VoiceName.Charon,
    description: 'The King of Texture',
    bestFor: 'Dramatic Monologues, Romantic Hooks',
    color: 'bg-gradient-to-r from-yellow-600 to-red-700',
    category: 'Ultra-Real Hindi',
    prompt: `Iconic Indian male voice. Charismatic, deep, slightly husky, and warm. Significant vocal texture and "broken" resonance for maximum realism.`
  },
  {
    id: 'vikram-v3',
    lang: Language.Hindi,
    name: 'VIKRAM (Intense V3+)',
    baseVoice: VoiceName.Fenrir,
    description: 'Deep & Intense Authority',
    bestFor: 'Dramatic, Suspense, Leadership',
    color: 'bg-black',
    category: 'Ultra-Real Hindi',
    prompt: `Deepest possible Hindi male voice. Gravity-heavy, dark, thick, and intimidatingly masculine. High command tone.`
  },

  // ENGLISH VOICES
  {
    id: 'austin-v3',
    lang: Language.English,
    name: 'AUSTIN (Elite Male V3+)',
    baseVoice: VoiceName.Charon,
    description: 'Deep / Professional / Impressive',
    bestFor: 'Documentaries, High-End Ads, Business',
    color: 'bg-gradient-to-r from-slate-700 to-slate-900',
    category: 'Standard',
    prompt: `ELITE MALE PERFORMANCE: A deep, resonant, and highly sophisticated English male voice. Cinematic baritone quality. Impeccable articulation.`
  },
  {
    id: 'elara-v3',
    lang: Language.English,
    name: 'ELARA (Velvet Female V3+)',
    baseVoice: VoiceName.Kore,
    description: 'Smooth / Sophisticated / Clear',
    bestFor: 'AI Assistants, Audiobooks, Luxury Brands',
    color: 'bg-gradient-to-r from-rose-400 to-purple-600',
    category: 'Standard',
    prompt: `VELVET FEMALE PERFORMANCE: A smooth, sophisticated, and ultra-clear English female voice. Professional yet warm. High melodic flow.`
  }
];

const MODULATION_PRESETS = Object.values(ModulationPreset);
const EMOTIONS = Object.values(Emotion);
const LANGUAGES = Object.values(Language);
const LANGUAGE_POLICIES = Object.values(LanguagePolicy);

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.Hindi);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    PERSONAS.find(p => p.lang === Language.Hindi)?.id || PERSONAS[0].id
  );
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>(Emotion.Neutral);
  const [pitch, setPitch] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [modulation, setModulation] = useState<ModulationPreset>(ModulationPreset.None);
  const [languagePolicy, setLanguagePolicy] = useState<LanguagePolicy>(LanguagePolicy.Auto);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isNaturalizing, setIsNaturalizing] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [history, setHistory] = useState<TTSHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const filteredPersonas = useMemo(() => {
    return PERSONAS.filter(p => p.lang === selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (!filteredPersonas.find(p => p.id === selectedPersonaId)) {
      setSelectedPersonaId(filteredPersonas[0]?.id || PERSONAS[0].id);
    }
  }, [selectedLanguage, filteredPersonas, selectedPersonaId]);

  const selectedPersona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];

  const handlePersonaSelect = async (persona: typeof PERSONAS[0]) => {
    setSelectedPersonaId(persona.id);
    
    // Play Demo
    setIsDemoLoading(true);
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      
      const demoText = persona.lang === Language.Hindi 
        ? "Namaste. Yeh ek chhota voice demo hai. Sun ke dekhiye, kitna natural lag raha hai."
        : "Hello. This is a short voice demo. Take a listen and see how natural it sounds.";

      const base64Data = await ttsService.generateSpeech(
        demoText,
        persona.baseVoice,
        Emotion.Neutral,
        persona.lang,
        LanguagePolicy.Auto,
        persona.prompt,
        0, // Reset pitch for demo
        1.0, // Reset speed for demo
        ModulationPreset.None
      );

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const uint8Data = decodeBase64(base64Data);
      const audioBuffer = await pcmToAudioBuffer(uint8Data, audioContextRef.current);
      const wavBlob = createWavFile(audioBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.play();
    } catch (err: any) {
      console.error("Demo failed:", err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleNaturalize = async () => {
    if (!text.trim()) return;
    setIsNaturalizing(true);
    try {
      const improved = await ttsService.naturalizeScript(text, selectedLanguage);
      setText(improved);
    } catch (err) {
      console.error(err);
      setError("Failed to transform script.");
    } finally {
      setIsNaturalizing(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const base64Data = await ttsService.generateSpeech(
        text,
        selectedPersona.baseVoice,
        selectedEmotion,
        selectedLanguage,
        languagePolicy,
        selectedPersona.prompt,
        pitch,
        speed,
        modulation
      );

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const uint8Data = decodeBase64(base64Data);
      const audioBuffer = await pcmToAudioBuffer(uint8Data, audioContextRef.current);
      const wavBlob = createWavFile(audioBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);

      const newItem: TTSHistoryItem = {
        id: crypto.randomUUID(),
        text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        voiceName: selectedPersona.name,
        emotion: selectedEmotion,
        language: selectedLanguage,
        audioUrl,
        timestamp: Date.now()
      };

      setHistory(prev => [newItem, ...prev]);
      
      const audio = new Audio(audioUrl);
      audio.play();

    } catch (err: any) {
      setError(err.message || "Failed to render audio.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetControls = () => {
    setPitch(0);
    setSpeed(1.0);
    setModulation(ModulationPreset.None);
    setSelectedEmotion(Emotion.Neutral);
  };

  return (
    <div className="min-h-screen pb-24 bg-[#05060a] text-slate-100 selection:bg-amber-500/40 font-sans">
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-3xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-2xl font-black tracking-tight flex items-center gap-2">
                Aura <span className="text-amber-500">STUDIO</span>
              </span>
              <span className="text-[9px] font-black tracking-[0.4em] text-slate-500 uppercase">V3+ Cinematic Engine</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex bg-black/40 p-1 rounded-xl border border-white/5">
              {LANGUAGE_POLICIES.map(p => (
                <button
                  key={p}
                  onClick={() => setLanguagePolicy(p)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${languagePolicy === p ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${selectedLanguage === lang ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {/* Main Script Workspace */}
          <section className="bg-slate-900/20 border border-white/5 rounded-[3rem] p-10 shadow-[0_0_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-4">
                <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)]"></div>
                Voice Script
              </h2>
              <button
                onClick={handleNaturalize}
                disabled={isNaturalizing || !text.trim()}
                className={`relative flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all border ${isNaturalizing ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-black shadow-2xl shadow-amber-500/10'}`}
              >
                {isNaturalizing ? (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                {isNaturalizing ? 'V3+ Tuning...' : 'AI Transform'}
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={selectedLanguage === Language.Hindi ? 'Enter Hindi content... Use [sigh] or [chuckle] for drama.' : 'Enter English script... Use [brackets] for emotional depth.'}
              className="w-full h-80 bg-transparent border-none p-0 text-3xl leading-snug focus:outline-none resize-none placeholder-slate-900 selection:bg-amber-500/30 font-medium"
            />
          </section>

          {/* Modulation & Pitch Controls */}
          <section className="bg-slate-950/40 border border-white/5 rounded-[3rem] p-10 grid grid-cols-1 md:grid-cols-2 gap-10 shadow-2xl">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Modulation Presets</h3>
              <div className="flex flex-wrap gap-3">
                {MODULATION_PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setModulation(p)}
                    className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${modulation === p ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Vocal Pitch</span>
                  <span className={pitch < 0 ? 'text-blue-400' : pitch > 0 ? 'text-rose-400' : ''}>
                    {pitch === 0 ? 'Studio Default' : pitch < 0 ? 'Deep Bass' : 'Light High'}
                  </span>
                </div>
                <input 
                  type="range" min="-50" max="50" step="25" 
                  value={pitch} onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Narration Pace</span>
                  <span>{speed}x Speed</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.25" 
                  value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </section>

          {/* Emotions */}
          <section className="bg-slate-950/40 border border-white/5 rounded-[3rem] p-10 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Primary Emotion</h3>
            <div className="flex flex-wrap gap-3">
              {EMOTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setSelectedEmotion(e)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedEmotion === e ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-200'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Studio Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-8 h-[calc(100vh-12rem)] flex flex-col sticky top-24 backdrop-blur-2xl shadow-3xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black">V3+ {selectedLanguage} Suite</h2>
              <button onClick={resetControls} className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest">Reset</button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {filteredPersonas.map(v => (
                <button
                  key={v.id}
                  onClick={() => handlePersonaSelect(v)}
                  className={`w-full group text-left p-6 rounded-[2rem] border transition-all relative overflow-hidden ${selectedPersonaId === v.id ? 'bg-white/5 border-white/20 shadow-2xl ring-1 ring-white/10' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl ${v.color} flex items-center justify-center text-white font-black group-hover:rotate-12 transition-all duration-500 relative`}>
                      {v.name.charAt(0)}
                      {selectedPersonaId === v.id && isDemoLoading && (
                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black flex items-center gap-2">
                        {v.name.split(' (')[0]}
                        {selectedPersonaId === v.id && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60 truncate w-32">{v.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 h-52 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 block mb-4">Studio Archives</span>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem]">
                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest opacity-30 text-center px-4">No takes recorded</span>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                      <div className="flex flex-col gap-0.5 w-24">
                        <span className="text-[9px] font-bold text-slate-400 truncate">{item.text}</span>
                        <span className="text-[7px] text-slate-600 font-black uppercase">{item.voiceName}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => new Audio(item.audioUrl).play()} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-slate-300 transition-all">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                        </button>
                        <a href={item.audioUrl} download={`${item.voiceName}_render.wav`} className="p-2.5 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Main RENDER FAB */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !text.trim()}
          className={`group flex items-center gap-8 px-16 py-8 rounded-full font-black text-2xl transition-all shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)] active:scale-95 ${isLoading ? 'bg-slate-900 text-slate-700 cursor-wait' : 'bg-white text-black hover:scale-[1.03] hover:bg-amber-400 transition-all duration-500'}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-amber-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="tracking-tighter uppercase font-display">Rendering Studio...</span>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="bg-black text-white p-4 rounded-full shadow-2xl">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
              </div>
              <span className="tracking-tighter uppercase font-display">Render Cinematic</span>
            </div>
          )}
        </button>
      </div>

      {error && (
        <div className="fixed top-24 right-10 bg-rose-600/95 backdrop-blur-2xl px-8 py-6 rounded-3xl text-white shadow-2xl animate-in fade-in slide-in-from-right-10">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Engine Error</div>
          <div className="text-sm font-bold">{error}</div>
        </div>
      )}
    </div>
  );
};

export default App;
