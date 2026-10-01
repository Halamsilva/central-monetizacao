// Web Audio API ambient countryside sound & Speech synthesis helper

class RuralAudioEngine {
  private ctx: AudioContext | null = null;
  private isAmbientPlaying: boolean = false;
  private windGain: GainNode | null = null;
  private cricketsInterval: number | null = null;
  private isSpeechActive: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Atmospheric countryside sound (gentle breeze & soft crickets)
  public startAmbient() {
    if (this.isAmbientPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isAmbientPlaying = true;

    // Pink noise buffer for wind/breeze
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Lowpass filter for deep wind
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.windGain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 3);

    whiteNoise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    whiteNoise.start();

    // Occasional gentle cricket chirps
    this.cricketsInterval = window.setInterval(() => {
      if (!this.ctx || !this.isAmbientPlaying) return;
      this.playCricketChirp();
    }, 4500);
  }

  private playCricketChirp() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(4400, now);
      osc.frequency.exponentialRampToValueAtTime(4600, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.windGain && this.ctx) {
      try {
        this.windGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
      } catch {
        // ignore
      }
    }
    if (this.cricketsInterval) {
      clearInterval(this.cricketsInterval);
      this.cricketsInterval = null;
    }
  }

  public getIsAmbientPlaying(): boolean {
    return this.isAmbientPlaying;
  }

  // Voice narration in Portuguese with elderly, unhurried cadence (male or female)
  public speakPortuguese(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    gender: 'male' | 'female' = 'male'
  ): { cancel: () => void } {
    if (!('speechSynthesis' in window)) {
      console.warn('Síntese de voz não suportada neste navegador.');
      return { cancel: () => {} };
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Try to find a Brazilian Portuguese voice matching requested gender
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter(v => v.lang.includes('pt') || v.lang.includes('PT'));

    let chosenVoice = null;
    if (gender === 'female') {
      chosenVoice = ptVoices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('mulher') || 
        v.name.toLowerCase().includes('maria') || 
        v.name.toLowerCase().includes('luciana') || 
        v.name.toLowerCase().includes('heloisa') ||
        v.name.toLowerCase().includes('francisca') ||
        v.name.toLowerCase().includes('fernanda')
      ) || ptVoices.find(v => !v.name.toLowerCase().includes('ricardo') && !v.name.toLowerCase().includes('felipe')) || ptVoices[0];

      utterance.rate = 0.94; // Cadência natural, serena e pausada (fica sob 9 segundos)
      utterance.pitch = 1.02; // Suave, maternal, acolhedora
    } else {
      chosenVoice = ptVoices.find(v => 
        v.name.toLowerCase().includes('male') || 
        v.name.toLowerCase().includes('homem') || 
        v.name.toLowerCase().includes('ricardo') || 
        v.name.toLowerCase().includes('felipe')
      ) || ptVoices[0];

      utterance.rate = 0.92; // Cadência pausada de senhor da roça mantendo a fala sob 9 segundos
      utterance.pitch = 0.85; // Grave, calmo e sereno
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }
    utterance.lang = 'pt-BR';

    utterance.onstart = () => {
      this.isSpeechActive = true;
      onStart?.();
    };

    utterance.onend = () => {
      this.isSpeechActive = false;
      onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeechActive = false;
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);

    return {
      cancel: () => {
        window.speechSynthesis.cancel();
        this.isSpeechActive = false;
        onEnd?.();
      }
    };
  }

  public stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeechActive = false;
  }
}

export const ruralAudio = new RuralAudioEngine();
