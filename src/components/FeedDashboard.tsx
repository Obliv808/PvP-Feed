"use client";

import { useMemo, useState } from "react";
import type { PvpArticle } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";
import {
  PVP_TOPICS,
  WOW_CLASSES,
  matchesTopic,
  detectArticleClasses,
  type PvpTopicInfo,
  type WowClassInfo,
} from "@/lib/wow-classes";
import {
  Search,
  X,
  RotateCcw,
  RefreshCw,
  Swords,
  Shield,
  Flag,
  Trophy,
  Flame,
  Layers,
} from "lucide-react";

function formatSync(iso: string | null) {
  if (!iso) return "Waiting for first background sync";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function getTopicIcon(topicId: string) {
  switch (topicId) {
    case "tuning":
      return <Swords className="h-3.5 w-3.5" />;
    case "arena":
      return <Shield className="h-3.5 w-3.5" />;
    case "battleground":
      return <Flag className="h-3.5 w-3.5" />;
    case "seasons":
      return <Trophy className="h-3.5 w-3.5" />;
    case "tournaments":
      return <Flame className="h-3.5 w-3.5" />;
    default:
      return <Layers className="h-3.5 w-3.5" />;
  }
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
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function runSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const payload = (await response.json()) as {
        error?: string;
        accepted?: number;
        newItems?: number;
      };
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

  // Precompute topic article counts for badges
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const topic of PVP_TOPICS) {
      counts[topic.id] = initialArticles.filter((a) => matchesTopic(a, topic.id)).length;
    }
    return counts;
  }, [initialArticles]);

  // Precompute class article counts for badges
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of initialArticles) {
      const classes = detectArticleClasses(a);
      for (const c of classes) {
        counts[c.name] = (counts[c.name] ?? 0) + 1;
      }
    }
    return counts;
  }, [initialArticles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return initialArticles.filter((article) => {
      // 1. Topic filter
      if (!matchesTopic(article, selectedTopic)) {
        return false;
      }

      // 2. Class filter
      if (selectedClass) {
        const classes = detectArticleClasses(article);
        const matchesClass = classes.some(
          (c) => c.name.toLowerCase() === selectedClass.toLowerCase(),
        );
        if (!matchesClass) return false;
      }

      // 3. Search query
      if (needle) {
        const combined = `${article.title} ${article.summary} ${article.pvpExcerpt ?? ""}`.toLowerCase();
        if (!combined.includes(needle)) return false;
      }

      return true;
    });
  }, [initialArticles, selectedTopic, selectedClass, query]);

  const hasActiveFilters = selectedTopic !== "all" || selectedClass !== null || query.trim() !== "";

  function resetFilters() {
    setSelectedTopic("all");
    setSelectedClass(null);
    setQuery("");
  }

  function handleClassClick(className: string) {
    if (selectedClass?.toLowerCase() === className.toLowerCase()) {
      setSelectedClass(null);
    } else {
      setSelectedClass(className);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="border border-[#d4af37]/30 bg-[#10131a]/85 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">
              World of Warcraft
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-black tracking-wide text-[#f6e7b2] sm:text-4xl lg:text-5xl">
              PvP Intelligence Feed
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#c9c2b0] sm:text-base">
              Arenas, Solo Shuffle, Battlegrounds, Gladiator rank tracking, and class tuning —
              monitored and extracted from Wowhead, MMO-Champion, and Icy Veins.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <button
              type="button"
              onClick={() => void runSync()}
              disabled={syncing}
              className="inline-flex items-center gap-2 border border-[#d4af37]/50 bg-gradient-to-b from-[#332913] to-[#1f180a] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f6d56b] transition hover:border-[#d4af37] hover:from-[#433519] hover:to-[#2b220e] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-[#d4af37]" : ""}`} />
              {syncing ? "Syncing feeds..." : "Sync now"}
            </button>
            <div className="text-xs text-[#9d957f]">
              <span>Last sync: {formatSync(lastSync)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#d4af37]/15 pt-3 text-xs text-[#9d957f]">
          <span>
            <strong className="text-[#f6e7b2]">{initialArticles.length}</strong> PvP updates cached
          </span>
          {lastError ? <span className="text-red-300">Sync warning: {lastError}</span> : null}
          {syncMessage ? <span className="text-[#f6d56b]">{syncMessage}</span> : null}
        </div>
      </header>

      {/* Filter Section: PvP Topics + Class Chips + Search */}
      <section className="mt-6 flex flex-col gap-5 border border-[#d4af37]/25 bg-[#12161f]/80 p-5">
        {/* Row 1: Topic Category Tabs */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8e8672]">
            Category
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {PVP_TOPICS.map((topic: PvpTopicInfo) => {
              const active = selectedTopic === topic.id;
              const count = topicCounts[topic.id] ?? 0;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`inline-flex items-center gap-2 border px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                    active
                      ? "border-[#d4af37] bg-[#d4af37] text-[#141006] shadow-sm"
                      : "border-[#d4af37]/30 bg-[#0c0f16] text-[#e8e4d9] hover:border-[#d4af37]/70 hover:bg-[#161a24]"
                  }`}
                >
                  <span className={active ? "text-[#141006]" : "text-[#d4af37]"}>
                    {getTopicIcon(topic.id)}
                  </span>
                  <span>{topic.label}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                      active ? "bg-[#141006]/20 text-[#141006]" : "bg-[#1b202c] text-[#a69e8b]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Class Filter Chips */}
        <div className="border-t border-[#d4af37]/15 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8e8672]">
              Filter by Class
            </span>
            {selectedClass && (
              <button
                type="button"
                onClick={() => setSelectedClass(null)}
                className="text-[11px] text-[#d4af37] underline underline-offset-2 hover:text-[#f6d56b]"
              >
                Reset class
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedClass(null)}
              className={`rounded-sm border px-2.5 py-1 text-xs font-medium transition ${
                selectedClass === null
                  ? "border-[#d4af37] bg-[#d4af37]/20 text-[#f6d56b]"
                  : "border-white/15 bg-[#0b0e14] text-[#b8b09a] hover:border-white/40"
              }`}
            >
              All Classes
            </button>
            {WOW_CLASSES.map((cls: WowClassInfo) => {
              const count = classCounts[cls.name] ?? 0;
              const isSelected = selectedClass?.toLowerCase() === cls.name.toLowerCase();
              return (
                <button
                  key={cls.name}
                  type="button"
                  onClick={() => handleClassClick(cls.name)}
                  className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium transition ${
                    isSelected
                      ? "border-white bg-white/20 text-white shadow-sm"
                      : count > 0
                        ? "border-white/15 bg-[#0b0e14] text-[#e8e4d9] hover:border-white/40 hover:bg-[#161a24]"
                        : "border-white/10 bg-[#0b0e14]/50 text-[#6f6959] hover:border-white/20"
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
                  {count > 0 && (
                    <span className="text-[10px] text-[#9d957f]">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Search Bar */}
        <div className="border-t border-[#d4af37]/15 pt-4">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#8a7f66]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PvP changes, abilities, specs, or keywords..."
              className="w-full border border-[#d4af37]/25 bg-[#0b0d12] py-2.5 pr-10 pl-10 text-sm text-[#f3ead0] outline-none placeholder:text-[#6e6857] focus:border-[#d4af37]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-[#8a7f66] hover:text-[#f3ead0]"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xs border border-[#d4af37]/20 bg-[#0c0f16] px-3.5 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#a8a08d]">
                Showing {filteredArticles.length} of {initialArticles.length} updates:
              </span>
              {selectedTopic !== "all" && (
                <span className="inline-flex items-center gap-1 rounded bg-[#d4af37]/20 px-2 py-0.5 text-[#f6d56b]">
                  <span>Topic:</span>
                  <strong>{PVP_TOPICS.find((t) => t.id === selectedTopic)?.label}</strong>
                  <button
                    type="button"
                    onClick={() => setSelectedTopic("all")}
                    className="ml-1 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedClass && (
                <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-white">
                  <span>Class:</span>
                  <strong>{selectedClass}</strong>
                  <button
                    type="button"
                    onClick={() => setSelectedClass(null)}
                    className="ml-1 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              )}
              {query.trim() && (
                <span className="inline-flex items-center gap-1 rounded bg-[#d4af37]/20 px-2 py-0.5 text-[#f6d56b]">
                  <span>Search:</span>
                  <strong>&quot;{query.trim()}&quot;</strong>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="ml-1 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-semibold text-[#d4af37] underline underline-offset-2 hover:text-[#f6d56b]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </section>

      {/* Articles Grid or Empty State */}
      {filteredArticles.length === 0 ? (
        <div className="mt-8 border border-dashed border-[#d4af37]/30 bg-[#10131a]/40 p-12 text-center text-[#b8b09a]">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[#f3ead0]">
            No matching PvP articles found
          </p>
          <p className="mx-auto mt-2.5 max-w-md text-sm text-[#8f8774]">
            No articles match your current topic, class, or search filters. Try clearing your
            filters or search terms.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 border border-[#d4af37]/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f6d56b] hover:bg-[#d4af37]/10"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              activeClass={selectedClass}
              onSelectClass={handleClassClick}
            />
          ))}
        </section>
      )}
    </main>
  );
}
