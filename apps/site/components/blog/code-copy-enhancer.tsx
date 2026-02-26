"use client";

import { useEffect, useRef } from "react";

interface BlogCodeCopyEnhancerProps {
  containerId: string;
}

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"></path><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"></path></svg>`;

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"></path></svg>`;

function createCopyButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className =
    "blog-copy-btn absolute top-3 right-0 sm:right-3 flex items-center justify-center size-7 rounded-md bg-[#f9f9f8] text-neutral-400 hover:text-neutral-700 cursor-pointer";
  btn.setAttribute("aria-label", "Copy code");
  btn.innerHTML = COPY_ICON;
  return btn;
}

export function BlogCodeCopyEnhancer({ containerId }: BlogCodeCopyEnhancerProps) {
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const preElements = container.querySelectorAll<HTMLElement>("pre.shiki");

    preElements.forEach((pre) => {
      if (pre.parentElement?.classList.contains("blog-code-wrapper")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "blog-code-wrapper relative";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const btn = createCopyButton();
      wrapper.appendChild(btn);

      let resetTimer: ReturnType<typeof setTimeout> | null = null;

      const handleClick = async () => {
        const code = pre.querySelector("code");
        const text = code?.innerText ?? pre.innerText;
        try {
          await navigator.clipboard.writeText(text);
          btn.innerHTML = CHECK_ICON;
          if (resetTimer) clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            btn.innerHTML = COPY_ICON;
          }, 1500);
        } catch {
          // clipboard not available
        }
      };

      btn.addEventListener("click", handleClick);

      cleanupRef.current.push(() => {
        btn.removeEventListener("click", handleClick);
        if (resetTimer) clearTimeout(resetTimer);
        wrapper.parentNode?.insertBefore(pre, wrapper);
        wrapper.remove();
      });
    });

    return () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
    };
  }, [containerId]);

  return null;
}
