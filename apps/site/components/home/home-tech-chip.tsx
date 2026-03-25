import type { TechItem } from "./home-data";

export function HomeTechChip({ tech }: { tech: TechItem }) {
  return (
    <div className="group flex shrink-0 items-center gap-2 border border-neutral-200 px-3.5 py-2 transition-colors hover:border-neutral-400">
      <img
        src={tech.path}
        alt={tech.name}
        className="opacity-50 h-4 w-auto group-hover:opacity-100 transition-opacity"
      />
      <span className="font-geist-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 whitespace-nowrap transition-colors group-hover:text-neutral-700">
        {tech.name}
      </span>
    </div>
  );
}
