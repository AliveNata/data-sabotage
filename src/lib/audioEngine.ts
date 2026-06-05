type BGMType = 'lobby' | 'intro' | 'night' | 'day' | 'gameover' | 'none';
type SFXType = 'click' | 'join' | 'start' | 'kill' | 'protect' | 'scan' | 'vote' | 'eliminate' | 'win' | 'lose' | 'message' | 'transition' | 'tick' | 'reveal';

interface AudioSettings {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  muted: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  bgmVolume: 0.4,
  sfxVolume: 0.6,
  muted: false,
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentBGM: BGMType = 'none';
  private bgmNodes: OscillatorNode[] = [];
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private settings: AudioSettings = { ...DEFAULT_SETTINGS };
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ds-audio-settings');
      if (saved) {
        try { this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch {}
      }
    }
  }

  private init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.bgmGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.bgmGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.applyVolumes();
    this.initialized = true;
  }

  private applyVolumes() {
    if (!this.masterGain || !this.bgmGain || !this.sfxGain) return;
    const m = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setValueAtTime(m, this.ctx!.currentTime);
    this.bgmGain.gain.setValueAtTime(this.settings.bgmVolume, this.ctx!.currentTime);
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx!.currentTime);
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ds-audio-settings', JSON.stringify(this.settings));
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.applyVolumes();
    this.saveSettings();
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- BGM ---

  private stopBGMNodes() {
    this.bgmNodes.forEach(n => { try { n.stop(); } catch {} });
    this.bgmNodes = [];
    if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; }
  }

  playBGM(type: BGMType) {
    if (type === this.currentBGM) return;
    this.init();
    this.stopAllBGM();
    this.currentBGM = type;
    if (type === 'none') return;

    switch (type) {
      case 'lobby': this.bgmLobby(); break;
      case 'intro': this.bgmIntro(); break;
      case 'night': this.bgmNight(); break;
      case 'day': this.bgmDay(); break;
      case 'gameover': this.bgmGameover(); break;
    }
  }

  stopBGM() {
    this.stopAllBGM();
    this.currentBGM = 'none';
  }

  private bgmIntervals: ReturnType<typeof setInterval>[] = [];

  private stopBGMExtras() {
    this.bgmIntervals.forEach(id => clearInterval(id));
    this.bgmIntervals = [];
  }

  private stopAllBGM() {
    this.stopBGMNodes();
    this.stopBGMExtras();
  }

  private scheduleNote(freq: number, type: OscillatorType, startTime: number, duration: number, vol: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.setValueAtTime(vol, startTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.bgmGain!);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    this.bgmNodes.push(osc);
  }

  private loopMelody(notes: { freq: number; dur: number }[], type: OscillatorType, vol: number, bpm: number) {
    const beatDur = 60 / bpm;
    let loopLen = 0;
    notes.forEach(n => { loopLen += n.dur * beatDur; });

    const playLoop = () => {
      let t = this.ctx!.currentTime + 0.05;
      notes.forEach(n => {
        if (n.freq > 0) {
          this.scheduleNote(n.freq, type, t, n.dur * beatDur * 0.9, vol);
        }
        t += n.dur * beatDur;
      });
    };

    playLoop();
    const id = setInterval(playLoop, loopLen * 1000);
    this.bgmIntervals.push(id);
  }

  private loopDrum(pattern: ('k' | 'h' | 's' | '.')[], bpm: number, vol: number) {
    const stepDur = 60 / bpm / 2;

    const playStep = (type: 'k' | 'h' | 's', time: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      if (type === 'k') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
        gain.gain.setValueAtTime(vol * 1.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        gain.connect(this.bgmGain!);
      } else if (type === 's') {
        osc.type = 'triangle';
        osc.frequency.value = 200;
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        gain.gain.setValueAtTime(vol * 0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain!);
      } else {
        osc.type = 'square';
        osc.frequency.value = 6000;
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        gain.gain.setValueAtTime(vol * 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain!);
      }

      osc.start(time);
      osc.stop(time + 0.2);
      this.bgmNodes.push(osc);
    };

    const totalDur = pattern.length * stepDur;

    const playLoop = () => {
      const now = this.ctx!.currentTime + 0.05;
      pattern.forEach((step, i) => {
        if (step !== '.') playStep(step, now + i * stepDur);
      });
    };

    playLoop();
    const id = setInterval(playLoop, totalDur * 1000);
    this.bgmIntervals.push(id);
  }

  private bgmLobby() {
    // Upbeat tech startup lobby
    const bpm = 120;

    // Punchy bass
    const bass = [
      { freq: 130.8, dur: 0.5 }, { freq: 0, dur: 0.25 }, { freq: 130.8, dur: 0.25 },
      { freq: 146.8, dur: 0.5 }, { freq: 0, dur: 0.5 },
      { freq: 164.8, dur: 0.5 }, { freq: 0, dur: 0.25 }, { freq: 164.8, dur: 0.25 },
      { freq: 130.8, dur: 0.5 }, { freq: 0, dur: 0.5 },
    ];
    this.loopMelody(bass, 'square', 0.025, bpm);

    // Catchy synth melody
    const melody = [
      { freq: 523.3, dur: 0.25 }, { freq: 659.3, dur: 0.25 }, { freq: 784, dur: 0.5 },
      { freq: 880, dur: 0.25 }, { freq: 784, dur: 0.25 }, { freq: 659.3, dur: 0.5 },
      { freq: 0, dur: 0.5 },
      { freq: 587.3, dur: 0.25 }, { freq: 659.3, dur: 0.25 }, { freq: 784, dur: 0.5 },
      { freq: 659.3, dur: 0.5 }, { freq: 523.3, dur: 0.5 },
      { freq: 0, dur: 0.5 },
    ];
    this.loopMelody(melody, 'triangle', 0.04, bpm);

    // Fast arpeggio layer
    const arp = [
      { freq: 1047, dur: 0.25 }, { freq: 880, dur: 0.25 },
      { freq: 784, dur: 0.25 }, { freq: 659.3, dur: 0.25 },
      { freq: 784, dur: 0.25 }, { freq: 880, dur: 0.25 },
      { freq: 1047, dur: 0.25 }, { freq: 0, dur: 0.75 },
    ];
    this.loopMelody(arp, 'sine', 0.02, bpm);

    // Driving beat
    this.loopDrum(['k', 'h', 's', 'h', 'k', 'k', 's', 'h', 'k', 'h', 's', 'h', 'k', 'h', 's', 'k'], bpm, 0.045);
  }

  private bgmIntro() {
    // Epic cinematic build-up
    const bpm = 100;

    // Rising bass
    const bass = [
      { freq: 65.4, dur: 1 }, { freq: 82.4, dur: 1 },
      { freq: 98, dur: 1 }, { freq: 110, dur: 1 },
      { freq: 82.4, dur: 1 }, { freq: 98, dur: 1 },
      { freq: 110, dur: 1 }, { freq: 130.8, dur: 1 },
    ];
    this.loopMelody(bass, 'sawtooth', 0.035, bpm);

    // Dramatic arpeggio
    const arp = [
      { freq: 261.6, dur: 0.25 }, { freq: 329.6, dur: 0.25 },
      { freq: 392, dur: 0.25 }, { freq: 523.3, dur: 0.25 },
      { freq: 659.3, dur: 0.25 }, { freq: 523.3, dur: 0.25 },
      { freq: 392, dur: 0.25 }, { freq: 329.6, dur: 0.25 },
      { freq: 293.7, dur: 0.25 }, { freq: 349.2, dur: 0.25 },
      { freq: 440, dur: 0.25 }, { freq: 523.3, dur: 0.25 },
      { freq: 659.3, dur: 0.25 }, { freq: 523.3, dur: 0.25 },
      { freq: 440, dur: 0.25 }, { freq: 349.2, dur: 0.25 },
    ];
    this.loopMelody(arp, 'triangle', 0.03, bpm);

    // Building drums
    this.loopDrum(['k', '.', 'h', '.', 'k', '.', 'h', 'h', 'k', 'h', 's', 'h', 'k', 'h', 's', 'h'], bpm, 0.035);
  }

  private bgmNight() {
    // Intense cyber-heist
    const bpm = 130;

    // Aggressive bass
    const bass = [
      { freq: 82.4, dur: 0.25 }, { freq: 0, dur: 0.25 }, { freq: 82.4, dur: 0.25 }, { freq: 82.4, dur: 0.25 },
      { freq: 0, dur: 0.25 }, { freq: 98, dur: 0.25 }, { freq: 0, dur: 0.25 }, { freq: 73.4, dur: 0.25 },
      { freq: 82.4, dur: 0.25 }, { freq: 0, dur: 0.25 }, { freq: 82.4, dur: 0.5 },
      { freq: 110, dur: 0.25 }, { freq: 98, dur: 0.25 }, { freq: 82.4, dur: 0.5 },
    ];
    this.loopMelody(bass, 'sawtooth', 0.03, bpm);

    // Tense synth
    const melody = [
      { freq: 440, dur: 0.25 }, { freq: 466.2, dur: 0.25 }, { freq: 440, dur: 0.25 }, { freq: 392, dur: 0.25 },
      { freq: 349.2, dur: 0.5 }, { freq: 0, dur: 0.5 },
      { freq: 392, dur: 0.25 }, { freq: 440, dur: 0.25 }, { freq: 523.3, dur: 0.5 },
      { freq: 466.2, dur: 0.25 }, { freq: 440, dur: 0.25 }, { freq: 392, dur: 0.5 },
      { freq: 0, dur: 0.5 },
    ];
    this.loopMelody(melody, 'square', 0.02, bpm);

    // High-energy beat
    this.loopDrum(['k', 'h', 's', 'h', 'k', 'h', 's', 'k', 'k', 'h', 's', 'h', 'k', 'k', 's', 'h'], bpm, 0.04);
  }

  private bgmDay() {
    // Energetic standup / debate music
    const bpm = 128;

    // Funky bass
    const bass = [
      { freq: 130.8, dur: 0.25 }, { freq: 0, dur: 0.25 }, { freq: 164.8, dur: 0.25 }, { freq: 0, dur: 0.25 },
      { freq: 174.6, dur: 0.5 }, { freq: 164.8, dur: 0.25 }, { freq: 130.8, dur: 0.25 },
      { freq: 0, dur: 0.25 }, { freq: 130.8, dur: 0.25 }, { freq: 0, dur: 0.25 }, { freq: 196, dur: 0.25 },
      { freq: 174.6, dur: 0.5 }, { freq: 0, dur: 0.5 },
    ];
    this.loopMelody(bass, 'square', 0.025, bpm);

    // Bright bouncy melody
    const melody = [
      { freq: 784, dur: 0.25 }, { freq: 880, dur: 0.25 }, { freq: 1047, dur: 0.5 },
      { freq: 880, dur: 0.25 }, { freq: 0, dur: 0.25 },
      { freq: 784, dur: 0.25 }, { freq: 659.3, dur: 0.25 }, { freq: 784, dur: 0.5 },
      { freq: 0, dur: 0.5 },
      { freq: 880, dur: 0.25 }, { freq: 784, dur: 0.25 },
      { freq: 659.3, dur: 0.25 }, { freq: 587.3, dur: 0.25 },
      { freq: 659.3, dur: 0.5 }, { freq: 0, dur: 0.5 },
    ];
    this.loopMelody(melody, 'triangle', 0.04, bpm);

    // Groovy drum
    this.loopDrum(['k', 'h', 's', 'h', 'k', 'k', 's', 'h', 'k', 'h', 's', 'k', 'k', 'h', 's', 'h'], bpm, 0.045);
  }

  private bgmGameover() {
    // Victory fanfare
    const bpm = 115;

    // Power chords
    const chords = [
      { freq: 261.6, dur: 1 }, { freq: 329.6, dur: 1 },
      { freq: 392, dur: 1 }, { freq: 523.3, dur: 1 },
      { freq: 349.2, dur: 1 }, { freq: 440, dur: 1 },
      { freq: 523.3, dur: 1 }, { freq: 392, dur: 1 },
    ];
    this.loopMelody(chords, 'sine', 0.04, bpm);

    // Triumphant melody
    const melody = [
      { freq: 784, dur: 0.5 }, { freq: 880, dur: 0.5 },
      { freq: 1047, dur: 1 }, { freq: 880, dur: 0.5 }, { freq: 1047, dur: 0.5 },
      { freq: 1175, dur: 1 }, { freq: 0, dur: 0.5 },
      { freq: 1047, dur: 0.25 }, { freq: 880, dur: 0.25 },
      { freq: 784, dur: 0.5 }, { freq: 659.3, dur: 0.5 },
      { freq: 784, dur: 1 }, { freq: 0, dur: 1 },
    ];
    this.loopMelody(melody, 'triangle', 0.04, bpm);

    // Celebration beat
    this.loopDrum(['k', 'h', 's', 'h', 'k', 'k', 's', 'h', 'k', 'h', 's', 'k', 'k', 'h', 's', 'h'], bpm, 0.04);
  }

  // --- SFX ---

  playSFX(type: SFXType) {
    this.init();
    if (this.settings.muted) return;

    switch (type) {
      case 'click': this.sfxClick(); break;
      case 'join': this.sfxJoin(); break;
      case 'start': this.sfxStart(); break;
      case 'kill': this.sfxKill(); break;
      case 'protect': this.sfxProtect(); break;
      case 'scan': this.sfxScan(); break;
      case 'vote': this.sfxVote(); break;
      case 'eliminate': this.sfxEliminate(); break;
      case 'win': this.sfxWin(); break;
      case 'lose': this.sfxLose(); break;
      case 'message': this.sfxMessage(); break;
      case 'transition': this.sfxTransition(); break;
      case 'tick': this.sfxTick(); break;
      case 'reveal': this.sfxReveal(); break;
    }
  }

  private playSFXNote(freq: number, type: OscillatorType, duration: number, vol = 0.15) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start();
    osc.stop(this.ctx!.currentTime + duration);
  }

  private sfxClick() {
    this.playSFXNote(800, 'sine', 0.08, 0.1);
    this.playSFXNote(1200, 'sine', 0.06, 0.05);
  }

  private sfxJoin() {
    const t = this.ctx!.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.3);
    });
  }

  private sfxStart() {
    const t = this.ctx!.currentTime;
    [392, 523, 659, 784].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.4);
    });
  }

  private sfxKill() {
    const t = this.ctx!.currentTime;
    // Low menacing hit
    this.playSFXNote(80, 'sawtooth', 0.5, 0.2);
    // Descending scream
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.6);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  private sfxProtect() {
    const t = this.ctx!.currentTime;
    [440, 554, 659].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.4);
    });
  }

  private sfxScan() {
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.3);
    osc.frequency.linearRampToValueAtTime(300, t + 0.6);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  private sfxVote() {
    this.playSFXNote(600, 'triangle', 0.15, 0.12);
    setTimeout(() => this.playSFXNote(800, 'triangle', 0.1, 0.08), 80);
  }

  private sfxEliminate() {
    const t = this.ctx!.currentTime;
    this.playSFXNote(200, 'sawtooth', 0.4, 0.15);
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.8);
    gain.gain.setValueAtTime(0.08, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t + 0.1);
    osc.stop(t + 0.9);
  }

  private sfxWin() {
    const t = this.ctx!.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.6);
    });
  }

  private sfxLose() {
    const t = this.ctx!.currentTime;
    [400, 350, 300, 200].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, t + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.2);
      osc.stop(t + i * 0.2 + 0.5);
    });
  }

  private sfxMessage() {
    this.playSFXNote(1000, 'sine', 0.06, 0.06);
  }

  private sfxTransition() {
    const t = this.ctx!.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  private sfxTick() {
    this.playSFXNote(1500, 'sine', 0.03, 0.05);
  }

  private sfxReveal() {
    const t = this.ctx!.currentTime;
    [600, 800, 1000, 1200].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.2);
    });
  }
}

let instance: AudioEngine | null = null;

export function getAudio(): AudioEngine {
  if (!instance) {
    instance = new AudioEngine();
  }
  return instance;
}

export type { AudioSettings, BGMType, SFXType };
