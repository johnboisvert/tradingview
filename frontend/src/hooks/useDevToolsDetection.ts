import { useEffect, useState } from 'react';

/**
 * useDevToolsDetection
 * --------------------
 * Heuristic detection of DevTools being open.
 * Uses two signals:
 *   1. Large gap between window.outerWidth/Height and innerWidth/Height
 *      (typical when a devtools panel is docked).
 *   2. A `debugger` timing trick: when devtools is open, hitting the
 *      debugger statement introduces a noticeable delay.
 *
 * Returns `true` when DevTools is likely open.
 * Admins should simply not consume this hook (or ignore the value).
 */
export function useDevToolsDetection(options: { enabled: boolean }): boolean {
  const { enabled } = options;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }

    let rafId: number | null = null;
    let cancelled = false;

    const SIZE_THRESHOLD = 160;
    const TIMING_THRESHOLD = 100; // ms

    const check = () => {
      if (cancelled) return;

      // 1) Size heuristic
      const widthGap = window.outerWidth - window.innerWidth;
      const heightGap = window.outerHeight - window.innerHeight;
      const sizeOpen = widthGap > SIZE_THRESHOLD || heightGap > SIZE_THRESHOLD;

      // 2) Debugger timing heuristic (only runs occasionally to not disturb UX)
      let timingOpen = false;
      try {
        const start = performance.now();
        // eslint-disable-next-line no-debugger
        debugger;
        const elapsed = performance.now() - start;
        if (elapsed > TIMING_THRESHOLD) timingOpen = true;
      } catch {
        // ignore
      }

      const detected = sizeOpen || timingOpen;
      setOpen((prev) => (prev !== detected ? detected : prev));

      // re-schedule
      rafId = window.setTimeout(check, 1500) as unknown as number;
    };

    rafId = window.setTimeout(check, 1500) as unknown as number;

    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.clearTimeout(rafId);
      }
    };
  }, [enabled]);

  return open;
}

export default useDevToolsDetection;