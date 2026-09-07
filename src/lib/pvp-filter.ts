/**
 * Zero-token PvP gatekeeper.
 *
 * Implements the requested system prompt as a local parser so sync never
 * spends AI tokens. Optional OpenAI is opt-in via OPENAI_API_KEY + USE_AI_FILTER=true.
 */

const PVP_POSITIVE = [
  "pvp",
  "player versus player",
  "player vs player",
  "player vs. player",
  "arena",
  "arenas",
  "battleground",
  "battlegrounds",
  "rated battleground",
  "rated battlegrounds",
  "rbg",
  "rbgs",
  "solo shuffle",
  "shuffle",
  "blitz",
  "battleground blitz",
  "bg blitz",
  "gladiator",
  "glad title",
  "forged gladiator",
  "combatant",
  "rival",
  "duelist",
  "elite rating",
  "conquest",
  "conquest cap",
  "honor gear",
  "honor set",
  "vicious saddle",
  "vicious mount",
  "war mode",
  "world pvp",
  "duel",
  "dueling",
  "skirmish",
  "arena rating",
  "pvp rating",
  "pvp talent",
  "pvp talents",
  "pvp class",
  "class balance",
  "tuning for pvp",
  "pvp hotfix",
  "pvp hotfixes",
  "pvp changes",
  "pvp update",
  "pvp updates",
  "pvp tuning",
  "pvp adjustments",
  "pvp balance",
  "pvp combat",
  "pvp vendor",
  "pvp gear",
  "pvp trinket",
  "pvp rewards",
  "season of pvp",
  "arena season",
  "pvp season",
  "awc",
  "arena world championship",
  "3v3",
  "2v2",
  "shuffle rating",
  "bloody tokens",
];

const PVE_NEGATIVE = [
  "mythic+",
  "mythic plus",
  "m+",
  "raid finder",
  "looking for raid",
  "lfr",
  "raid tier",
  "raid boss",
  "raid guide",
  "mythic raid",
  "heroic raid",
  "dungeon guide",
  "keystone",
  "great vault pve",
  "delve",
  "delves",
  "questing",
  "leveling guide",
  "campaign chapter",
  "lore recap",
  "story campaign",
  "raid tier list",
];

export function cleanText(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[\\/]*(?:b|i|u|url|quote|code|list|ul|li|font|color)[^\]]*\]/gi, " ")
    .replace(/\\r|\\n|\r|\n/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPvpExcerpt(raw: string): string | null {
  if (!raw) return null;

  const patterns = [
    /player\s+versus\s+player/i,
    /player\s+vs\.?\s+player/i,
    /\bpvp\s+(?:tuning|changes|hotfixes|adjustments|balance|updates|talents|combat|season|rewards|vendor)\b/i,
    /(?:<h[1-6][^>]*>|<b[^>]*>|==+|###+)\s*[^<]*\bpvp\b[^<]*(?:<\/h[1-6]>|<\/b>|==+|)/i,
  ];

  let bestIdx = -1;
  for (const pat of patterns) {
    const match = raw.match(pat);
    if (match && match.index !== undefined) {
      bestIdx = match.index;
      break;
    }
  }

  if (bestIdx === -1) {
    const m = raw.match(
      /\b(?:solo\s+shuffle|battleground\s+blitz|rated\s+battleground|arena\s+world\s+championship|gladiator\s+rankings?)\b/i,
    );
    if (m && m.index !== undefined) bestIdx = m.index;
  }

  if (bestIdx === -1) return null;

  const slice = raw.substring(bestIdx, bestIdx + 2200);
  const clean = cleanText(slice);
  if (clean.length < 20) return null;
  if (clean.length <= 280) return clean;
  return clean.slice(0, 280).trim() + "…";
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function snippet(text: string, max = 280) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

export function classifyPvpLocal(
  title: string,
  description: string,
  scrapedContent?: string | null,
): "TRUE" | "FALSE" {
  const normTitle = normalize(title);
  const normDesc = normalize(description);
  const combinedRaw = `${description} ${scrapedContent ?? ""}`;

  // 1. Check for explicit PvP sections or headings (e.g. Player versus Player in hotfix notes)
  const explicitExcerpt = extractPvpExcerpt(combinedRaw);
  if (explicitExcerpt) {
    return "TRUE";
  }

  // 2. Check title for direct PvP keywords
  const titleHasPvp = PVP_POSITIVE.some((term) => normTitle.includes(term));
  if (titleHasPvp) {
    return "TRUE";
  }

  // 3. Keyword density comparison
  const haystack = normalize(`${title} ${description} ${scrapedContent ? scrapedContent.slice(0, 3000) : ""}`);
  const hasPvp = PVP_POSITIVE.some((term) => haystack.includes(term));
  const hasPve = PVE_NEGATIVE.some((term) => haystack.includes(term));

  if (hasPvp && !hasPve) return "TRUE";
  if (hasPvp && hasPve) {
    const pvpHits = PVP_POSITIVE.filter((term) => haystack.includes(term)).length;
    const pveHits = PVE_NEGATIVE.filter((term) => haystack.includes(term)).length;
    return pvpHits >= pveHits ? "TRUE" : "FALSE";
  }

  return "FALSE";
}

async function classifyPvpWithOpenAI(
  title: string,
  description: string,
  scrapedContent?: string | null,
): Promise<"TRUE" | "FALSE"> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return classifyPvpLocal(title, description, scrapedContent);

  const excerpt = extractPvpExcerpt(`${description} ${scrapedContent ?? ""}`);
  const contextSnippet = excerpt || snippet(`${description} ${scrapedContent ? cleanText(scrapedContent) : ""}`, 600);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: 4,
      messages: [
        {
          role: "system",
          content:
            "Analyze the following WoW article title and content. If it contains information regarding PvP, Arenas, Battlegrounds, Rated Battlegrounds, Solo Shuffle, Gladiator rankings, or PvP class balance updates, respond with exactly 'TRUE'. If it is about Raids, Mythic+, PvE dungeons, general questing, leveling, or lore, respond with 'FALSE'.",
        },
        {
          role: "user",
          content: `Title: ${title}\nContent: ${contextSnippet}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return classifyPvpLocal(title, description, scrapedContent);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = (data.choices?.[0]?.message?.content ?? "").trim().toUpperCase();
  if (answer.startsWith("TRUE")) return "TRUE";
  if (answer.startsWith("FALSE")) return "FALSE";
  return classifyPvpLocal(title, description, scrapedContent);
}

export async function evaluateArticle(
  title: string,
  description: string,
  scrapedHtml?: string | null,
): Promise<{ isPvp: boolean; pvpExcerpt?: string; summary: string }> {
  const combinedRaw = `${description} ${scrapedHtml ?? ""}`;
  const excerpt = extractPvpExcerpt(combinedRaw);

  const useAi = process.env.USE_AI_FILTER === "true" && Boolean(process.env.OPENAI_API_KEY);
  const verdict = useAi
    ? await classifyPvpWithOpenAI(title, description, scrapedHtml)
    : classifyPvpLocal(title, description, scrapedHtml);

  const isPvp = verdict === "TRUE";
  const summary = excerpt || toSummary(description);

  return {
    isPvp,
    pvpExcerpt: excerpt ?? undefined,
    summary,
  };
}

export async function isPvpArticle(title: string, description: string, scrapedHtml?: string | null) {
  const result = await evaluateArticle(title, description, scrapedHtml);
  return result.isPvp;
}

export function toSummary(description: string) {
  return snippet(cleanText(description), 220) || "PvP-related World of Warcraft news.";
}
