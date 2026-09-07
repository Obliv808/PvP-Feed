import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { EMPTY_CACHE, type FeedCache, type PvpArticle } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(DATA_DIR, "pvp-feed.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readCache(): FeedCache {
  ensureDataDir();
  if (!existsSync(CACHE_FILE)) {
    writeFileSync(CACHE_FILE, JSON.stringify(EMPTY_CACHE, null, 2), "utf8");
    return { ...EMPTY_CACHE, articles: [], seenIds: [] };
  }

  try {
    const parsed = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as FeedCache;
    return {
      lastSync: parsed.lastSync ?? null,
      lastError: parsed.lastError ?? null,
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
      seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds : [],
    };
  } catch {
    return { ...EMPTY_CACHE, articles: [], seenIds: [] };
  }
}

export function writeCache(cache: FeedCache) {
  ensureDataDir();
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

export function articleId(link: string, title: string) {
  return `${link.trim().toLowerCase()}::${title.trim().toLowerCase()}`;
}

export function upsertArticles(existing: PvpArticle[], incoming: PvpArticle[]) {
  const byId = new Map(existing.map((article) => [article.id, article]));
  for (const article of incoming) {
    byId.set(article.id, article);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );
}
