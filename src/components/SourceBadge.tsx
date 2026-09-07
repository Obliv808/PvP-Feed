import type { SourceId } from "@/lib/types";

const STYLES: Record<SourceId, string> = {
  Wowhead: "bg-amber-500/15 text-amber-300 border-amber-400/40",
  "MMO-Champion": "bg-sky-500/15 text-sky-300 border-sky-400/40",
  "Icy Veins": "bg-cyan-500/15 text-cyan-300 border-cyan-400/40",
};

export function SourceBadge({ source }: { source: SourceId }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${STYLES[source]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {source}
    </span>
  );
}
