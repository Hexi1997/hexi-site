"use client";

import { useEffect, useMemo, useState } from "react";

interface TypewriterSloganProps {
  text: string;
  speed?: number;
}

export function TypewriterSlogan({ text, speed = 65 }: TypewriterSloganProps) {
  const [count, setCount] = useState(0);
  const done = count >= text.length;

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const timeout = window.setTimeout(() => {
        setCount(text.length);
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const timer = window.setInterval(() => {
      setCount((prev) => {
        if (prev >= text.length) {
          window.clearInterval(timer);
          return text.length;
        }
        return prev + 1;
      });
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  const content = useMemo(() => text.slice(0, count), [text, count]);

  return (
    <h1 className="mt-1 uppercase text-2xl font-anta font-semibold text-neutral-900" aria-label={text}>
      {content}
      <span
        aria-hidden="true"
        className={`ml-0.5 inline-block h-[1.1em] w-[2px] align-[-0.15em] bg-neutral-900 ${
          done ? "typewriter-caret" : ""
        }`}
      />
    </h1>
  );
}
