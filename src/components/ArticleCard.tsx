import type { PvpArticle } from "@/lib/types";
import { SourceBadge } from "./SourceBadge";

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

export function ArticleCard({ article }: { article: PvpArticle }) {
  return (
    <article className="group flex h-full flex-col border border-[#d4af37]/25 bg-[#141821]/90 p-5 shadow-[inset_0_1px_0_rgba(212,175,55,0.12)] transition hover:border-[#d4af37]/70 hover:bg-[#191e29]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <SourceBadge source={article.source} />
        <time className="text-xs text-[#b8b09a]" dateTime={article.pubDate}>
          {formatWhen(article.pubDate)}
        </time>
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-lg leading-snug text-[#f3ead0] group-hover:text-[#f6d56b]">
        {article.title}
      </h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#c9c2b0]">{article.summary}</p>
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
