export class SfxEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  init() {
    if (this.context) return;
    const context = new AudioContext();
    const masterGain = context.createGain();
    masterGain.gain.value = 0.08;
    masterGain.connect(context.destination);
    this.context = context;
    this.masterGain = masterGain;
  }

  setMuted(muted: boolean) {
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.08;
    }
  }

  private playTone(frequency: number, duration = 0.08, type: OscillatorType = 'sine') {
    if (!this.context || !this.masterGain) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.9;
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  move() {
    this.playTone(420, 0.05, 'triangle');
  }

  rotate() {
    this.playTone(620, 0.06, 'square');
  }

  softDrop() {
    this.playTone(220, 0.04, 'sine');
  }

  hardDrop() {
    this.playTone(140, 0.1, 'sawtooth');
  }

  lineClear() {
    this.playTone(780, 0.12, 'triangle');
    this.playTone(980, 0.12, 'triangle');
  }

  levelUp() {
    this.playTone(520, 0.1, 'square');
    this.playTone(820, 0.12, 'square');
  }

  gameOver() {
    this.playTone(120, 0.3, 'sawtooth');
  }
}
