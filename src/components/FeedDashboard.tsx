"use client";

import { useMemo, useState } from "react";
import type { PvpArticle, SourceId } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";

const FILTERS: Array<"All Sources" | SourceId> = [
  "All Sources",
  "Wowhead",
  "MMO-Champion",
  "Icy Veins",
];

function formatSync(iso: string | null) {
  if (!iso) return "Waiting for first background sync";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function FeedDashboard({
  initialArticles,
  lastSync,
  lastError,
}: {
  initialArticles: PvpArticle[];
  lastSync: string | null;
  lastError: string | null;
}) {
  const [source, setSource] = useState<(typeof FILTERS)[number]>("All Sources");
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function runSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const payload = (await response.json()) as { error?: string; accepted?: number; newItems?: number };
      if (!response.ok) throw new Error(payload.error || "Sync failed");
      setSyncMessage(
        `Processed ${payload.newItems ?? 0} new items, kept ${payload.accepted ?? 0} PvP articles.`,
      );
      window.location.reload();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Sync failed");
      setSyncing(false);
    }
  }

  const articles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return initialArticles.filter((article) => {
      const sourceOk = source === "All Sources" || article.source === source;
      if (!sourceOk) return false;
      if (!needle) return true;
      return `${article.title} ${article.summary}`.toLowerCase().includes(needle);
    });
  }, [initialArticles, query, source]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <header className="border border-[#d4af37]/30 bg-[#10131a]/80 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">
          World of Warcraft
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-black tracking-wide text-[#f6e7b2] sm:text-5xl">
          PvP Intelligence Feed
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#c9c2b0] sm:text-base">
          Arenas, Battlegrounds, Rated BGs, Solo Shuffle, Gladiator news, and PvP class
          tuning — cached locally every 30 minutes. Page loads read JSON only; no AI tokens
          on the dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#9d957f]">
          <span>Last sync: {formatSync(lastSync)}</span>
          <span>{initialArticles.length} PvP articles cached</span>
          {lastError ? <span className="text-red-300">Sync warning: {lastError}</span> : null}
          {syncMessage ? <span className="text-[#f6d56b]">{syncMessage}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => void runSync()}
          disabled={syncing}
          className="mt-5 border border-[#d4af37]/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f6d56b] hover:bg-[#d4af37]/10 disabled:opacity-50"
        >
          {syncing ? "Syncing feeds..." : "Sync now"}
        </button>
      </header>

      <section className="mt-6 flex flex-col gap-4 border border-[#d4af37]/20 bg-[#12161f]/70 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const active = source === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSource(filter)}
                className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition ${
                  active
                    ? "border-[#d4af37] bg-[#d4af37] text-[#1a1408]"
                    : "border-[#d4af37]/30 text-[#e8e4d9] hover:border-[#d4af37]/70"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
        <label className="relative block flex-1">
          <span className="sr-only">Search by class or keyword</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by class, e.g. Mage, Paladin, Warrior..."
            className="w-full border border-[#d4af37]/25 bg-[#0b0d12] px-3 py-2 text-sm text-[#f3ead0] outline-none placeholder:text-[#7d7664] focus:border-[#d4af37]"
          />
        </label>
      </section>

      {articles.length === 0 ? (
        <div className="mt-8 border border-dashed border-[#d4af37]/30 p-10 text-center text-[#b8b09a]">
          <p className="font-[family-name:var(--font-display)] text-xl text-[#f3ead0]">
            No matching PvP articles
          </p>
          <p className="mt-2 text-sm">
            The 30-minute background sync will append new PvP posts as they appear. Keep this
            app running, or hit <code className="text-[#f6d56b]">/api/sync</code> to refresh now.
          </p>
        </div>
      ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </section>
      )}
    </main>
  );
}
