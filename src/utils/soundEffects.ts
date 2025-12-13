// Retro 8-bit sound effects using Web Audio API
export class SoundEffects {
    private audioContext: AudioContext;
    private enabled: boolean;
    private musicEnabled: boolean;
    private backgroundMusic: OscillatorNode | null = null;
    private musicGainNode: GainNode | null = null;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.musicEnabled = localStorage.getItem('musicEnabled') === 'true';
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', String(this.enabled));
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('musicEnabled', String(this.musicEnabled));

        if (this.musicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    }

    private playTone(frequency: number, duration: number, type: OscillatorType = 'square', volume: number = 0.3) {
        if (!this.enabled) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Background Music - Looping retro melody
    startBackgroundMusic() {
        if (!this.musicEnabled || this.backgroundMusic) return;

        const melody = [523, 587, 659, 698, 784, 698, 659, 587]; // C-D-E-F-G-F-E-D
        let noteIndex = 0;

        const playNote = () => {
            if (!this.musicEnabled) return;

            this.playTone(melody[noteIndex], 0.4, 'sine', 0.08);
            noteIndex = (noteIndex + 1) % melody.length;

            setTimeout(playNote, 500);
        };

        playNote();
    }

    stopBackgroundMusic() {
        if (this.musicGainNode) {
            this.musicGainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        }
        this.backgroundMusic = null;
    }

    // Click/Button press
    click() {
        this.playTone(800, 0.1);
    }

    // Sword swing sound
    swordSwing() {
        if (!this.enabled) return;
        // Swoosh sound - frequency sweep
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.playTone(600 - i * 100, 0.05, 'sawtooth', 0.2), i * 20);
        }
    }

    // Combo hit sound
    comboHit(comboCount: number) {
        if (!this.enabled) return;
        // Higher pitch for higher combos
        const basePitch = 400;
        const pitch = basePitch + (comboCount * 50);
        this.playTone(Math.min(pitch, 1200), 0.1, 'square', 0.25);
    }

    // Achievement unlocked
    achievement() {
        if (!this.enabled) return;
        // Triumphant fanfare
        const notes = [523, 659, 784, 1047]; // C-E-G-C
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.2, 'square', 0.3), i * 100);
        });
    }

    // Success/Complete
    success() {
        this.playTone(523, 0.1); // C
        setTimeout(() => this.playTone(659, 0.1), 100); // E
        setTimeout(() => this.playTone(784, 0.2), 200); // G
    }

    // Upload
    upload() {
        this.playTone(440, 0.15);
        setTimeout(() => this.playTone(554, 0.15), 80);
    }

    // Error
    error() {
        this.playTone(200, 0.2);
        setTimeout(() => this.playTone(150, 0.3), 150);
    }

    // Processing tick
    tick() {
        this.playTone(880, 0.05);
    }

    // Download/Whoosh
    download() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.playTone(1000 - i * 150, 0.08), i * 50);
        }
    }

    // Hover
    hover() {
        this.playTone(1200, 0.03);
    }

    // Power up
    powerUp() {
        if (!this.enabled) return;
        for (let i = 0; i < 8; i++) {
            setTimeout(() => this.playTone(300 + i * 100, 0.1, 'square', 0.2), i * 60);
        }
    }
}

export const soundEffects = new SoundEffects();
