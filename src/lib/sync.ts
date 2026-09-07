import { fetchAllFeeds, scrapeArticlePage } from "./rss";
import { evaluateArticle } from "./pvp-filter";
import { articleId, readCache, upsertArticles, writeCache } from "./store";
import type { PvpArticle } from "./types";

let syncing = false;

function shouldScrapeArticle(source: string, title: string, desc: string): boolean {
  if (source === "MMO-Champion") return true;
  const combined = `${title} ${desc}`.toLowerCase();
  const hasPvpTerm =
    /\b(?:pvp|player\s+versus\s+player|player\s+vs\.?\s+player|arena|arenas|battleground|battlegrounds|shuffle|blitz|gladiator|awc|vicious|war mode|conquest|duel)\b/i.test(
      combined,
    );
  const hasHotfixOrTuning =
    /\b(?:hotfix(?:es)?|class\s+tuning|class\s+balance|class\s+changes|balance\s+update|weekly\s+hotfix)\b/i.test(
      combined,
    );
  return hasPvpTerm || hasHotfixOrTuning;
}

export async function syncPvpFeed() {
  if (syncing) {
    return { skipped: true as const, reason: "Sync already running" };
  }

  syncing = true;
  const cache = readCache();
  const existingArticles = new Map(cache.articles.map((a) => [a.id, a]));
  const seen = new Set(cache.seenIds);

  try {
    const { items, errors } = await fetchAllFeeds();

    // Re-evaluate candidate items that are either new or not yet in the accepted cache
    const fresh = items.filter((item) => {
      const id = articleId(item.link, item.title);
      return !existingArticles.has(id);
    });

    const accepted: PvpArticle[] = [];
    const concurrency = 8;

    for (let i = 0; i < fresh.length; i += concurrency) {
      const chunk = fresh.slice(i, i + concurrency);
      const evaluations = await Promise.all(
        chunk.map(async (item) => {
          const id = articleId(item.link, item.title);
          seen.add(id);

          const needsDeepScrape = shouldScrapeArticle(item.source, item.title, item.description);
          const scrapedHtml = needsDeepScrape ? await scrapeArticlePage(item.link) : null;
          const evaluation = await evaluateArticle(item.title, item.description, scrapedHtml);

          return { item, id, evaluation };
        }),
      );

      for (const { item, id, evaluation } of evaluations) {
        if (evaluation.isPvp) {
          accepted.push({
            id,
            title: item.title,
            link: item.link,
            pubDate: new Date(item.pubDate).toISOString(),
            source: item.source,
            summary: evaluation.summary,
            pvpExcerpt: evaluation.pvpExcerpt,
          });
        }
      }
    }

    const next = {
      lastSync: new Date().toISOString(),
      lastError: errors.length ? errors.join(" | ") : null,
      seenIds: [...seen],
      articles: upsertArticles(cache.articles, accepted),
    };

    writeCache(next);

    return {
      skipped: false as const,
      scanned: items.length,
      newItems: fresh.length,
      accepted: accepted.length,
      errors,
      lastSync: next.lastSync,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeCache({
      ...cache,
      lastSync: new Date().toISOString(),
      lastError: message,
    });
    throw error;
  } finally {
    syncing = false;
  }
}
