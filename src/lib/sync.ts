import { fetchAllFeeds } from "./rss";
import { isPvpArticle, toSummary } from "./pvp-filter";
import { articleId, readCache, upsertArticles, writeCache } from "./store";
import type { PvpArticle } from "./types";

let syncing = false;

export async function syncPvpFeed() {
  if (syncing) {
    return { skipped: true as const, reason: "Sync already running" };
  }

  syncing = true;
  const cache = readCache();
  const seen = new Set(cache.seenIds);

  try {
    const { items, errors } = await fetchAllFeeds();
    const fresh = items.filter((item) => !seen.has(articleId(item.link, item.title)));

    const accepted: PvpArticle[] = [];

    for (const item of fresh) {
      const id = articleId(item.link, item.title);
      seen.add(id);

      const keep = await isPvpArticle(item.title, item.description);
      if (!keep) continue;

      accepted.push({
        id,
        title: item.title,
        link: item.link,
        pubDate: new Date(item.pubDate).toISOString(),
        source: item.source,
        summary: toSummary(item.description),
      });
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
