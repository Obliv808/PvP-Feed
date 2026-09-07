import Parser from "rss-parser";
import type { RawFeedItem, SourceId } from "./types";

const FEED_UA = "curl/8.5.0";

export const FEEDS: { source: SourceId; urls: string[] }[] = [
  { source: "Wowhead", urls: ["https://www.wowhead.com/news/rss/retail"] },
  {
    source: "MMO-Champion",
    urls: [
      "https://www.mmo-champion.com/external.php?do=rss&type=newcontent&sectionid=1&days=14&count=25",
      "https://www.mmo-champion.com/external.php?do=rss&type=newcontent&sectionid=1&days=30&count=40",
    ],
  },
  {
    source: "Icy Veins",
    urls: [
      "https://wp-prod.icy-veins.com/custom-rss/?category=wow",
      "https://www.icy-veins.com/forums/rss/1-icy-veins-news.xml",
    ],
  },
];

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": FEED_UA,
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: ["content:encoded", "description"],
  },
});

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\/?(?:b|i|u|url|quote|code|list|ul|li|font|color)[^\]]*\]/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchXml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": FEED_UA,
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
}

export async function scrapeArticlePage(url: string): Promise<string | null> {
  let targetUrl = url;
  // Canonicalize Wowhead URLs (e.g. /news=12345/slug -> /news/slug-12345) to avoid redirect/202 loops
  const wowheadMatch = url.match(/wowhead\.com\/news=(\d+)\/([^\/?#]+)/);
  if (wowheadMatch) {
    targetUrl = `https://www.wowhead.com/news/${wowheadMatch[2]}-${wowheadMatch[1]}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "curl/8.5.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

export async function fetchSourceFeed(source: SourceId, urls: string[]): Promise<RawFeedItem[]> {
  const errors: string[] = [];

  for (const url of urls) {
    try {
      const xml = await fetchXml(url);
      const feed = await parser.parseString(xml);
      const items = (feed.items ?? [])
        .map((item) => {
          const title = (item.title ?? "").trim();
          const link = (item.link ?? item.guid ?? "").trim();
          const raw =
            (item["content:encoded"] as string | undefined) ||
            item.content ||
            item.description ||
            item.contentSnippet ||
            "";
          const description = stripHtml(raw);
          const pubDate = item.isoDate || item.pubDate || new Date().toISOString();
          return { title, link, pubDate, source, description };
        })
        .filter((item) => item.title && item.link);

      if (items.length) return items;
      errors.push(`${url} returned no items`);
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(errors.join(" | "));
}

export async function fetchAllFeeds() {
  const results = await Promise.allSettled(
    FEEDS.map((feed) => fetchSourceFeed(feed.source, feed.urls)),
  );

  const items: RawFeedItem[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    const source = FEEDS[index].source;
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      errors.push(`${source}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    }
  });

  return { items, errors };
}
