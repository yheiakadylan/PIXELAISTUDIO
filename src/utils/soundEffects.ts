// Retro 8-bit sound effects using Web Audio API
export class SoundEffects {
    private audioContext: AudioContext;
    private enabled: boolean;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', String(this.enabled));
    }

    private playTone(frequency: number, duration: number, type: OscillatorType = 'square') {
        if (!this.enabled) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Click/Button press
    click() {
        this.playTone(800, 0.1);
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
}

export const soundEffects = new SoundEffects();
