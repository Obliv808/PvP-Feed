"use client";

import type { PvpArticle } from "@/lib/types";
import { SourceBadge } from "./SourceBadge";
import { detectArticleClasses, type WowClassInfo } from "@/lib/wow-classes";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ArticleCard({
  article,
  onSelectClass,
  activeClass,
}: {
  article: PvpArticle;
  onSelectClass?: (className: string) => void;
  activeClass?: string | null;
}) {
  const classes = detectArticleClasses(article);

  return (
    <article className="group flex h-full flex-col border border-[#d4af37]/25 bg-[#141821]/90 p-5 shadow-[inset_0_1px_0_rgba(212,175,55,0.12)] transition hover:border-[#d4af37]/70 hover:bg-[#191e29]">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <SourceBadge source={article.source} />
        <time className="text-xs text-[#b8b09a]" dateTime={article.pubDate}>
          {formatWhen(article.pubDate)}
        </time>
      </div>

      <h2 className="font-[family-name:var(--font-display)] text-lg leading-snug text-[#f3ead0] group-hover:text-[#f6d56b]">
        {article.title}
      </h2>

      {/* Class tags if detected */}
      {classes.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {classes.map((cls: WowClassInfo) => {
            const isSelected = activeClass?.toLowerCase() === cls.name.toLowerCase();
            return (
              <button
                key={cls.name}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectClass?.(cls.name);
                }}
                className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-semibold transition ${
                  isSelected
                    ? "border-white/80 bg-white/20 text-white"
                    : "border-white/15 bg-[#0b0e14] text-[#d6d0bf] hover:border-white/40"
                }`}
                style={{
                  borderLeftColor: cls.color,
                  borderLeftWidth: "3px",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cls.color }}
                />
                <span>{cls.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex-1">
        {article.pvpExcerpt && (
          <div className="mb-2.5 rounded border border-[#d4af37]/30 bg-[#251e11]/80 px-3 py-2 text-xs text-[#f6e5b0]">
            <span className="font-bold uppercase tracking-wider text-[#f6d56b]">
              PvP Changes Found:{" "}
            </span>
            <span className="text-[#e2dac3]">{article.pvpExcerpt}</span>
          </div>
        )}
        {(!article.pvpExcerpt || article.summary !== article.pvpExcerpt) && (
          <p className="text-sm leading-relaxed text-[#c9c2b0]">{article.summary}</p>
        )}
      </div>

      <a
        href={article.link}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center justify-center border border-[#d4af37]/50 bg-gradient-to-b from-[#3a3016] to-[#241c0d] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f6d56b] transition hover:from-[#4a3d1b] hover:to-[#2c230f]"
      >
        Read on {article.source}
      </a>
    </article>
  );
}
