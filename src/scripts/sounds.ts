/**
 * Sound Manager for Portfolio Tour
 * Uses Web Audio API to generate retro typing sounds
 */

interface SoundManager {
  audioContext: AudioContext | null;
  isEnabled: boolean;
  voiceEnabled: boolean;
  volume: number;
  purrInterval: number | null;
  speechSynth: SpeechSynthesis | null;
  currentUtterance: SpeechSynthesisUtterance | null;
  preferredVoice: SpeechSynthesisVoice | null;
  init: () => void;
  initVoice: () => void;
  playTypingSound: () => void;
  playMeow: () => void;
  playPurr: () => void;
  playSuccess: () => void;
  speakMessage: (message: string) => void;
  stopSpeaking: () => void;
  addNoiseClick: (ctx: AudioContext, time: number) => void;
  startAmbientPurr: () => void;
  stopAmbientPurr: () => void;
  setEnabled: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

// Create the sound manager
const soundManager: SoundManager = {
  audioContext: null,
  isEnabled: true,
  voiceEnabled: true,
  volume: 0.5,
  purrInterval: null,
  speechSynth: null,
  currentUtterance: null,
  preferredVoice: null,

  init() {
    // Create AudioContext on first user interaction
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        this.isEnabled = false;
      }
    }
    // Initialize voice synthesis
    this.initVoice();
  },

  initVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      this.voiceEnabled = false;
      return;
    }

    this.speechSynth = window.speechSynthesis;

    // Find a cute/feminine voice
    const findCuteVoice = () => {
      const voices = this.speechSynth?.getVoices() || [];

      // Preferred voice names for a cute assistant (prioritized)
      const cuteVoiceNames = [
        'Samantha', // macOS - cute female voice
        'Karen',    // macOS AU
        'Moira',    // macOS IE
        'Tessa',    // macOS ZA
        'Microsoft Zira', // Windows
        'Google UK English Female',
        'Google US English Female',
        'Amelie',   // French but cute
        'Kyoko',    // Japanese
      ];

      // Try to find a preferred cute voice
      for (const name of cuteVoiceNames) {
        const voice = voices.find(v => v.name.includes(name));
        if (voice) {
          this.preferredVoice = voice;
          return;
        }
      }

      // Fallback: find any female-sounding or high-quality voice
      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('woman') ||
        /samantha|karen|zira|amelie|alice|emma|amy|joanna/i.test(v.name)
      );

      if (femaleVoice) {
        this.preferredVoice = femaleVoice;
        return;
      }

      // Last resort: use first available voice
      if (voices.length > 0) {
        this.preferredVoice = voices[0];
      }
    };

    // Voices might load async
    if (this.speechSynth.getVoices().length > 0) {
      findCuteVoice();
    } else {
      this.speechSynth.addEventListener('voiceschanged', findCuteVoice);
    }
  },

  playTypingSound() {
    if (!this.isEnabled || !this.audioContext) return;

    // Resume context if suspended (required after user interaction)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create oscillator for key click
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Random frequency for variety (mechanical keyboard feel)
    const baseFreq = 800 + Math.random() * 400;
    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    // Filter for softer sound
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);

    // Quick attack and decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    // Connect nodes
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Play
    osc.start(now);
    osc.stop(now + 0.05);

    // Add a subtle noise burst for mechanical feel
    this.addNoiseClick(ctx, now);
  },

  addNoiseClick(ctx: AudioContext, time: number) {
    // Create white noise buffer
    const bufferSize = ctx.sampleRate * 0.02; // 20ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3000, time);
    noiseFilter.Q.setValueAtTime(1, time);

    noiseGain.gain.setValueAtTime(this.volume * 0.15, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(time);
  },

  playMeow() {
    if (!this.isEnabled || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create a more realistic "meow" with multiple oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    osc3.type = 'triangle';

    // Meow frequency sweep - more dramatic
    // "Me" part - rising
    osc1.frequency.setValueAtTime(400, now);
    osc1.frequency.linearRampToValueAtTime(800, now + 0.15);
    // "ow" part - falling
    osc1.frequency.linearRampToValueAtTime(600, now + 0.4);
    osc1.frequency.linearRampToValueAtTime(400, now + 0.6);

    osc2.frequency.setValueAtTime(420, now);
    osc2.frequency.linearRampToValueAtTime(820, now + 0.15);
    osc2.frequency.linearRampToValueAtTime(620, now + 0.4);
    osc2.frequency.linearRampToValueAtTime(420, now + 0.6);

    osc3.frequency.setValueAtTime(800, now);
    osc3.frequency.linearRampToValueAtTime(1600, now + 0.15);
    osc3.frequency.linearRampToValueAtTime(1200, now + 0.4);

    // Filter for cat-like tone
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.linearRampToValueAtTime(1500, now + 0.15);
    filter.frequency.linearRampToValueAtTime(800, now + 0.5);
    filter.Q.setValueAtTime(2, now);

    // Louder envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume * 1.5, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(this.volume * 1.2, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.8, now + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
    osc3.stop(now + 0.6);
  },

  playPurr() {
    if (!this.isEnabled || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 1.5;

    // Create pink noise buffer for natural purr sound
    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    // Generate pink-ish noise (more natural than white noise)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // Bandpass filter to shape the purr tone (warm, rumbly)
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(180, now);
    filter.Q.setValueAtTime(3, now);

    // Second filter for extra warmth
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(400, now);

    // Main gain
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(this.volume * 1.2, now + 0.1);

    // Create the "purr-purr" rhythm with amplitude modulation
    // Cat purrs have a rhythmic inhale/exhale pattern ~25 cycles per second
    const purrRate = 22; // Hz - the rumbling frequency
    const purrCycles = Math.floor(duration * purrRate);
    const cycleLength = 1 / purrRate;

    for (let i = 0; i < purrCycles; i++) {
      const cycleStart = now + i * cycleLength;
      // Each cycle: quick rise, sustain, quick fall
      mainGain.gain.setValueAtTime(this.volume * 0.4, cycleStart);
      mainGain.gain.linearRampToValueAtTime(this.volume * 1.2, cycleStart + cycleLength * 0.3);
      mainGain.gain.linearRampToValueAtTime(this.volume * 0.4, cycleStart + cycleLength * 0.9);
    }

    // Fade out at the end
    mainGain.gain.setValueAtTime(this.volume * 0.8, now + duration - 0.2);
    mainGain.gain.linearRampToValueAtTime(0, now + duration);

    // Connect the chain
    noise.connect(filter);
    filter.connect(lowpass);
    lowpass.connect(mainGain);
    mainGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  },

  playSuccess() {
    if (!this.isEnabled || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Play ascending notes for success
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    });
  },

  speakMessage(message: string) {
    if (!this.voiceEnabled || !this.speechSynth) return;

    // Stop any current speech
    this.stopSpeaking();

    // Clean up the message for natural speech
    const cleanMessage = message
      .replace(/[*_~`]/g, '') // Remove markdown formatting
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanMessage);

    // Configure for a cute voice
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }

    // Cute voice settings: higher pitch, slightly faster, friendly tone
    utterance.pitch = 1.3;    // Higher pitch for cuteness (0.1 to 2)
    utterance.rate = 1.05;    // Slightly faster for energy (0.1 to 10)
    utterance.volume = this.volume * 1.5; // Match volume setting

    this.currentUtterance = utterance;
    this.speechSynth.speak(utterance);
  },

  stopSpeaking() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    this.currentUtterance = null;
  },

  startAmbientPurr() {
    if (this.purrInterval) return; // Already running

    // Play purr every 5-10 seconds randomly
    const playRandomPurr = () => {
      if (this.isEnabled && this.audioContext) {
        this.playPurr();
      }
      // Schedule next purr with random delay (5-10 seconds)
      const nextDelay = 5000 + Math.random() * 5000;
      this.purrInterval = window.setTimeout(() => {
        playRandomPurr();
      }, nextDelay);
    };

    // Start after initial delay (2 seconds)
    this.purrInterval = window.setTimeout(() => {
      playRandomPurr();
    }, 2000);
  },

  stopAmbientPurr() {
    if (this.purrInterval) {
      clearTimeout(this.purrInterval);
      this.purrInterval = null;
    }
  },

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAmbientPurr();
      this.stopSpeaking();
    }
  },

  setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
  },

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
};

// Export to window for global access
declare global {
  interface Window {
    soundManager: SoundManager;
  }
}

window.soundManager = soundManager;

export { soundManager };
