const STORAGE_KEY = 'portfolio-muted';

/** Retro sound effects built from oscillators and noise: tweak or add entries here. */
const EFFECTS = {
    hover: (s) => s.tone({ from: 1200, duration: 0.03, volume: 0.025 }),
    click: (s) => s.tone({ from: 660, to: 880, duration: 0.06, volume: 0.06 }),
    select: (s) => s.tone({ from: 520, to: 780, duration: 0.08, volume: 0.06 }),
    back: (s) => s.tone({ from: 600, to: 300, duration: 0.1, volume: 0.06 }),
    open: (s) => {
        s.tone({ type: 'sine', from: 150, to: 60, duration: 0.25, volume: 0.35 });
        s.noise({ duration: 0.15, volume: 0.12, frequency: 900 });
    },
    launch: (s) => {
        s.noise({ duration: 0.08, volume: 0.2, frequency: 2500 });
        [523, 659, 784, 1046].forEach((f, i) => s.tone({ from: f, duration: 0.09, volume: 0.06, delay: 0.15 + i * 0.08 }));
    },
    tvOn: (s) => {
        s.tone({ type: 'sawtooth', from: 80, to: 900, duration: 0.5, volume: 0.04 });
        s.noise({ duration: 0.6, volume: 0.07, frequency: 3000 });
    },
    tvOff: (s) => s.tone({ type: 'sine', from: 1400, to: 40, duration: 0.35, volume: 0.12 }),
};

/**
 * Tiny WebAudio synth. Browsers only allow audio after a user gesture,
 * so the audio context starts on the first click / key press.
 */
export class Sound {
    constructor() {
        this.ctx = null;
        try {
            this.muted = localStorage.getItem(STORAGE_KEY) === '1';
        } catch {
            this.muted = false;
        }

        const unlock = () => {
            this.ctx ??= new AudioContext();
            this.ctx.resume();
        };
        window.addEventListener('pointerdown', unlock, { once: true, capture: true });
        window.addEventListener('keydown', unlock, { once: true, capture: true });
    }

    setMuted(muted) {
        this.muted = muted;
        try {
            localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
        } catch {
            // Storage unavailable (private mode): the choice lasts for this visit only.
        }
    }

    play(name) {
        if (this.muted || this.ctx?.state !== 'running') return;
        EFFECTS[name]?.(this);
    }

    tone({ type = 'square', from, to = from, duration, volume, delay = 0 }) {
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(from, t);
        osc.frequency.exponentialRampToValueAtTime(to, t + duration);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
    }

    noise({ duration, volume, frequency, delay = 0 }) {
        const t = this.ctx.currentTime + delay;
        const length = Math.ceil(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

        const source = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        source.connect(filter).connect(gain).connect(this.ctx.destination);
        source.start(t);
    }
}
