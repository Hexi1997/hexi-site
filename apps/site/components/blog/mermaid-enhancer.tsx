"use client";

import { useEffect } from "react";

// Mermaid has shared configuration. Serialize complete initialize/render pairs,
// including across route changes and React's development effect replay.
let renderQueue: Promise<void> = Promise.resolve();

export function BlogMermaidEnhancer({ containerId }: { containerId: string }) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    const blocks = container?.querySelectorAll<HTMLElement>("[data-mermaid]");
    if (!blocks?.length) return;

    let disposed = false;
    const cleanups: (() => void)[] = [];

    for (const block of blocks) {
      const source = block.querySelector("pre");
      if (!source) continue;
      const code = source.textContent ?? "";
      const status = document.createElement("p");
      status.className = "blog-mermaid-status";
      status.setAttribute("role", "status");
      status.textContent = "图表加载中…";
      block.prepend(status);
      cleanups.push(() => {
        status.remove();
        source.hidden = false;
        delete block.dataset.mermaidState;
      });

      renderQueue = renderQueue.then(async () => {
        if (disposed) return;
        // An explicit container prevents Mermaid from leaving error SVGs on body.
        const scratch = document.createElement("div");
        scratch.className = "blog-mermaid-scratch";
        document.body.append(scratch);
        try {
          const { default: mermaid } = await import("mermaid");
          if (disposed) return;
          const dark = getComputedStyle(block).colorScheme === "dark" ||
            Boolean(block.closest(".dark"));
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            suppressErrorRendering: true,
            theme: dark ? "dark" : "neutral",
            fontFamily: "Arial, PingFang SC, sans-serif",
            flowchart: { htmlLabels: false },
          });
          const { svg } = await mermaid.render(`mermaid-${crypto.randomUUID()}`, code, scratch);
          if (disposed) return;

          const viewport = document.createElement("div");
          viewport.className = "blog-mermaid-viewport";
          viewport.innerHTML = svg;
          viewport.setAttribute("role", "img");
          viewport.setAttribute("aria-label", "Mermaid 图表，可放大查看或查看源码");
          const toolbar = document.createElement("div");
          toolbar.className = "blog-mermaid-toolbar";
          const sourceButton = document.createElement("button");
          sourceButton.type = "button";
          sourceButton.textContent = "查看源码";
          sourceButton.setAttribute("aria-expanded", "false");
          sourceButton.onclick = () => {
            source.hidden = !source.hidden;
            sourceButton.textContent = source.hidden ? "查看源码" : "收起源码";
            sourceButton.setAttribute("aria-expanded", String(!source.hidden));
          };
          const expandButton = document.createElement("button");
          expandButton.type = "button";
          expandButton.textContent = "放大查看";
          const dialog = document.createElement("dialog");
          dialog.className = "blog-mermaid-dialog";
          dialog.setAttribute("aria-label", "放大图表");
          const closeButton = document.createElement("button");
          closeButton.type = "button";
          closeButton.textContent = "关闭";
          closeButton.onclick = () => dialog.close();
          dialog.append(closeButton);
          // Move, don't clone: duplicate SVG IDs break markers and accessible titles.
          expandButton.onclick = () => {
            dialog.append(viewport);
            dialog.showModal();
          };
          dialog.onclose = () => { block.insertBefore(viewport, source); };
          dialog.onclick = (event) => { if (event.target === dialog) dialog.close(); };
          toolbar.append(expandButton, sourceButton);
          block.insertBefore(toolbar, source);
          block.insertBefore(viewport, source);
          block.append(dialog);
          source.hidden = true;
          status.remove();
          block.dataset.mermaidState = "ready";
          cleanups.push(() => {
            dialog.onclose = null;
            dialog.close();
            dialog.remove();
            viewport.remove();
            toolbar.remove();
            delete block.dataset.mermaidState;
          });
        } catch {
          if (!disposed) {
            status.textContent = "图表暂时无法渲染，以下为 Mermaid 源码。";
            block.dataset.mermaidState = "error";
          }
        } finally {
          scratch.remove();
        }
      });
    }
    return () => {
      disposed = true;
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, [containerId]);

  return null;
}
