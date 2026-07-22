import { useState, useEffect } from "react";

interface SpinDelayOptions {
  delay?: number;
  minDuration?: number;
}

export function useSpinDelay(
  loading: boolean,
  options: SpinDelayOptions = {},
): boolean {
  const { delay = 200, minDuration = 300 } = options;
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let minTimer: ReturnType<typeof setTimeout> | null = null;
    let startTime = 0;

    if (loading) {
      delayTimer = setTimeout(() => {
        startTime = Date.now();
        setShouldShow(true);
      }, delay);
    } else {
      if (shouldShow) {
        const elapsed = Date.now() - startTime;
        const remaining = minDuration - elapsed;

        if (remaining > 0) {
          minTimer = setTimeout(() => {
            setShouldShow(false);
          }, remaining);
        } else {
          setShouldShow(false);
        }
      } else {
        setShouldShow(false);
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minTimer) clearTimeout(minTimer);
    };
  }, [loading, delay, minDuration, shouldShow]);

  return shouldShow;
}
