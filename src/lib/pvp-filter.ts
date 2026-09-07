/**
 * Zero-token PvP gatekeeper.
 *
 * Implements the requested system prompt as a local parser so sync never
 * spends AI tokens. Optional OpenAI is opt-in via OPENAI_API_KEY + USE_AI_FILTER=true.
 */

const PVP_POSITIVE = [
  "pvp",
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
  "gladiator",
  "glad title",
  "combatant",
  "rival",
  "duelist",
  "elite rating",
  "conquest",
  "honor gear",
  "honor set",
  "vicious saddle",
  "vicious mount",
  "war mode",
  "world pvp",
  "duel",
  "skirmish",
  "arena rating",
  "pvp rating",
  "pvp talent",
  "pvp talents",
  "pvp class",
  "class balance",
  "tuning for pvp",
  "pvp hotfix",
  "pvp changes",
  "pvp update",
  "pvp vendor",
  "pvp rewards",
  "season of pvp",
  "arena season",
  "pvp season",
  "awc",
  "arena world championship",
  "3v3",
  "2v2",
  "shuffle rating",
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

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function snippet(text: string, max = 280) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

/**
 * System prompt (applied locally):
 * Analyze the following WoW article title and description. If it contains
 * information regarding PvP, Arenas, Battlegrounds, Rated Battlegrounds,
 * Solo Shuffle, Gladiator rankings, or PvP class balance updates, respond
 * with exactly 'TRUE'. If it is about Raids, Mythic+, PvE dungeons, general
 * questing, leveling, or lore, respond with 'FALSE'.
 */
export function classifyPvpLocal(title: string, description: string): "TRUE" | "FALSE" {
  const haystack = normalize(`${title} ${description}`);

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

async function classifyPvpWithOpenAI(title: string, description: string): Promise<"TRUE" | "FALSE"> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return classifyPvpLocal(title, description);

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
            "Analyze the following WoW article title and description. If it contains information regarding PvP, Arenas, Battlegrounds, Rated Battlegrounds, Solo Shuffle, Gladiator rankings, or PvP class balance updates, respond with exactly 'TRUE'. If it is about Raids, Mythic+, PvE dungeons, general questing, leveling, or lore, respond with 'FALSE'.",
        },
        {
          role: "user",
          content: `Title: ${title}\nDescription: ${snippet(description, 500)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return classifyPvpLocal(title, description);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = (data.choices?.[0]?.message?.content ?? "").trim().toUpperCase();
  if (answer.startsWith("TRUE")) return "TRUE";
  if (answer.startsWith("FALSE")) return "FALSE";
  return classifyPvpLocal(title, description);
}

export async function isPvpArticle(title: string, description: string) {
  const useAi = process.env.USE_AI_FILTER === "true" && Boolean(process.env.OPENAI_API_KEY);
  const verdict = useAi
    ? await classifyPvpWithOpenAI(title, description)
    : classifyPvpLocal(title, description);
  return verdict === "TRUE";
}

export function toSummary(description: string) {
  return snippet(description, 220) || "PvP-related World of Warcraft news.";
}
