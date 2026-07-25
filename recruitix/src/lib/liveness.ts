import type { Classifications } from '@mediapipe/tasks-vision';

const CLOSED_THRESHOLD = 0.5;
const OPEN_THRESHOLD = 0.3; // hysteresis around a single threshold to avoid chatter
const MIN_MS_BETWEEN_BLINKS = 150; // debounce: don't double-count one blink

function blinkScore(blendshapes: Classifications | null): number | null {
  if (!blendshapes) return null;
  const left = blendshapes.categories.find((c) => c.categoryName === 'eyeBlinkLeft')?.score;
  const right = blendshapes.categories.find((c) => c.categoryName === 'eyeBlinkRight')?.score;
  if (left === undefined || right === undefined) return null;
  return (left + right) / 2;
}

export interface BlinkDetector {
  /** Feed one frame's blendshapes classification into the detector. */
  update: (blendshapes: Classifications | null, timestampMs: number) => void;
  /**
   * Resolves true once `count` closed-to-open blink transitions have been observed,
   * false on timeout. A static photo held to the camera never crosses the closed->open
   * transition, so it will always time out rather than resolve true.
   */
  waitForBlinks: (count?: number, timeoutMs?: number) => Promise<boolean>;
  reset: () => void;
}

export function createBlinkDetector(): BlinkDetector {
  let eyesClosed = false;
  let lastBlinkAt = 0;
  let blinkCount = 0;
  let waiter: { target: number; resolve: (ok: boolean) => void; timeoutId: ReturnType<typeof setTimeout> } | null = null;

  function update(blendshapes: Classifications | null, timestampMs: number) {
    const score = blinkScore(blendshapes);
    if (score === null) return;

    if (!eyesClosed && score >= CLOSED_THRESHOLD) {
      eyesClosed = true;
    } else if (eyesClosed && score <= OPEN_THRESHOLD) {
      eyesClosed = false;
      if (timestampMs - lastBlinkAt >= MIN_MS_BETWEEN_BLINKS) {
        lastBlinkAt = timestampMs;
        blinkCount += 1;
        if (waiter && blinkCount >= waiter.target) {
          clearTimeout(waiter.timeoutId);
          waiter.resolve(true);
          waiter = null;
        }
      }
    }
  }

  function reset() {
    eyesClosed = false;
    lastBlinkAt = 0;
    blinkCount = 0;
    if (waiter) {
      clearTimeout(waiter.timeoutId);
      waiter.resolve(false);
      waiter = null;
    }
  }

  function waitForBlinks(count = 2, timeoutMs = 8000): Promise<boolean> {
    blinkCount = 0;
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        waiter = null;
        resolve(false);
      }, timeoutMs);
      waiter = { target: count, resolve, timeoutId };
    });
  }

  return { update, waitForBlinks, reset };
}
