import { useState, useEffect, useRef } from "react";

export function useQuizTimer(startTime, durationMinutes, onExpire) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!startTime || !durationMinutes) return;

    const startMs = new Date(startTime).getTime();
    const endMs = startMs + durationMinutes * 60 * 1000;

    const updateTimer = () => {
      const nowMs = Date.now();
      const diffSec = Math.floor((endMs - nowMs) / 1000);

      if (diffSec <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      } else {
        setTimeLeft(diffSec);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  const formatTime = (seconds) => {
    if (seconds == null) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return {
    timeLeft,
    isExpired,
    formattedTime: formatTime(timeLeft),
  };
}
