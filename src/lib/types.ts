export type SourceId = "Wowhead" | "MMO-Champion" | "Icy Veins";

export interface PvpArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: SourceId;
  summary: string;
  pvpExcerpt?: string;
}

export interface RawFeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: SourceId;
  description: string;
}

export interface FeedCache {
  lastSync: string | null;
  lastError: string | null;
  articles: PvpArticle[];
  seenIds: string[];
}

export const EMPTY_CACHE: FeedCache = {
  lastSync: null,
  lastError: null,
  articles: [],
  seenIds: [],
};
