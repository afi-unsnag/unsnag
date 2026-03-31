/**
 * Ambient loop + completion chime for the Notice step.
 *
 * Ambient comes from an MP3 in /public/audio for higher-quality sound.
 * Chime is synthesized so we do not need another asset.
 */

export type NoticeAudioHandle = {
  startAmbient: () => Promise<void>;
  endWithChime: () => void;
  stopImmediate: () => void;
  setMuted: (muted: boolean) => void;
};

function getAudioContextConstructor(): typeof AudioContext | null {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  );
}

function playChimeInto(c: AudioContext) {
  const out = c.createGain();
  out.gain.value = 0.12;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2800;
  filter.Q.value = 0.5;

  out.connect(filter);
  filter.connect(c.destination);

  const t0 = c.currentTime;
  // Gentle major triad, rolled off — less harsh than raw C5–E5–G5 sines
  const notes = [
    { f: 392.0, t: 0 },
    { f: 493.88, t: 0.1 },
    { f: 587.33, t: 0.2 },
  ];

  for (const { f, t } of notes) {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = c.createGain();
    const start = t0 + t;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.06, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
    o.connect(g);
    g.connect(out);
    o.start(start);
    o.stop(start + 1.6);
  }
}

export function createNoticeAudio(): NoticeAudioHandle {
  let audioEl: HTMLAudioElement | null = null;
  let chimeCtx: AudioContext | null = null;

  const fadeOutAndStop = (durationMs: number) => {
    if (!audioEl) return;
    const el = audioEl;
    const startVolume = el.volume;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      el.volume = startVolume * (1 - t);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.pause();
        el.currentTime = 0;
        el.volume = 0.45;
      }
    };
    requestAnimationFrame(tick);
  };

  return {
    async startAmbient() {
      if (!audioEl) {
        audioEl = new Audio('/audio/notice-ambient.mp3');
        audioEl.loop = true;
        audioEl.preload = 'auto';
        audioEl.volume = 0.45;
      }
      audioEl.currentTime = 0;
      try {
        await audioEl.play();
      } catch {
        // If autoplay gets blocked, fail quietly and allow app flow to continue.
      }
    },

    endWithChime() {
      fadeOutAndStop(900);

      const AC = getAudioContextConstructor();
      if (!AC) return;
      chimeCtx = new AC();
      void chimeCtx.resume().then(() => {
        playChimeInto(chimeCtx as AudioContext);
        window.setTimeout(() => {
          if (!chimeCtx) return;
          void chimeCtx.close().catch(() => undefined);
          chimeCtx = null;
        }, 2500);
      });
    },

    stopImmediate() {
      if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
      if (chimeCtx) {
        void chimeCtx.close().catch(() => undefined);
        chimeCtx = null;
      }
    },

    setMuted(muted: boolean) {
      if (audioEl) audioEl.volume = muted ? 0 : 0.45;
    },
  };
}
