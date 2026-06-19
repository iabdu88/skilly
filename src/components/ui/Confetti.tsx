"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  trigger: boolean;
  origin?: { x?: number; y?: number };
}

export function Confetti({ trigger, origin = { y: 0.6 } }: Props) {
  useEffect(() => {
    if (!trigger) return;
    confetti({
      particleCount: 130,
      spread: 85,
      origin,
      colors: ["#5B21B6", "#A78BFA", "#F59E0B", "#ffffff"],
      gravity: 0.9,
    });
  }, [trigger]);

  return null;
}
