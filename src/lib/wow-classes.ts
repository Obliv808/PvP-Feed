export interface WowClassInfo {
  name: string;
  id: string;
  color: string; // Official WoW hex color
  pattern: RegExp;
}

export const WOW_CLASSES: WowClassInfo[] = [
  { name: "Death Knight", id: "death-knight", color: "#C41E3A", pattern: /\b(?:death\s+knight|dk)\b/i },
  { name: "Demon Hunter", id: "demon-hunter", color: "#A330C9", pattern: /\b(?:demon\s+hunter|dh|havoc|vengeance|devourer)\b/i },
  { name: "Druid", id: "druid", color: "#FF7C0A", pattern: /\b(?:druid|balance|feral|guardian|restoration\s+druid)\b/i },
  { name: "Evoker", id: "evoker", color: "#33937F", pattern: /\b(?:evoker|devastation|preservation|augmentation)\b/i },
  { name: "Hunter", id: "hunter", color: "#AAD372", pattern: /\b(?:hunter|beast\s+mastery|marksmanship|survival)\b/i },
  { name: "Mage", id: "mage", color: "#3FC7EB", pattern: /\b(?:mage|arcane|fire\s+mage|frost\s+mage)\b/i },
  { name: "Monk", id: "monk", color: "#00FF98", pattern: /\b(?:monk|brewmaster|mistweaver|windwalker)\b/i },
  { name: "Paladin", id: "paladin", color: "#F48CBA", pattern: /\b(?:paladin|holy\s+paladin|protection\s+paladin|retribution)\b/i },
  { name: "Priest", id: "priest", color: "#FFFFFF", pattern: /\b(?:priest|discipline|holy\s+priest|shadow\s+priest)\b/i },
  { name: "Rogue", id: "rogue", color: "#FFF468", pattern: /\b(?:rogue|assassination|outlaw|subtlety)\b/i },
  { name: "Shaman", id: "shaman", color: "#0070DD", pattern: /\b(?:shaman|elemental|enhancement|restoration\s+shaman|farseer)\b/i },
  { name: "Warlock", id: "warlock", color: "#8788EE", pattern: /\b(?:warlock|affliction|demonology|destruction)\b/i },
  { name: "Warrior", id: "warrior", color: "#C69B6D", pattern: /\b(?:warrior|arms|fury|protection\s+warrior)\b/i },
];

export interface PvpTopicInfo {
  id: string;
  label: string;
  shortLabel: string;
  pattern: RegExp;
}

export const PVP_TOPICS: PvpTopicInfo[] = [
  {
    id: "all",
    label: "All Updates",
    shortLabel: "All",
    pattern: /.*/,
  },
  {
    id: "tuning",
    label: "Class Tuning & Balance",
    shortLabel: "Tuning",
    pattern: /\b(?:tuning|hotfix|hotfixes|balance|buff|nerf|talent|talents|cooldown|damage|healing|aura|class\s+changes|class\s+tuning|developer(?:s|'s)?\s+notes)\b/i,
  },
  {
    id: "arena",
    label: "Solo Shuffle & Arenas",
    shortLabel: "Arenas / Shuffle",
    pattern: /\b(?:arena|arenas|shuffle|solo\s+shuffle|2v2|3v3|skirmish|gladiator|glad|dampening|training\s+grounds:\s+arena)\b/i,
  },
  {
    id: "battleground",
    label: "Battlegrounds & Blitz",
    shortLabel: "BGs & Blitz",
    pattern: /\b(?:battleground|battlegrounds|blitz|bg\s+blitz|rated\s+battleground|rbg|rbgs|arathi|warsong|eye\s+of\s+the\s+storm|silvershard|gilneas|node|flag)\b/i,
  },
  {
    id: "seasons",
    label: "Seasons, Gear & Rewards",
    shortLabel: "Seasons & Gear",
    pattern: /\b(?:season|conquest|honor\s+gear|vicious|saddle|mount|rewards?|vendor|tier|trinket|elite\s+set|disqualif|weapon|upgrade|lacquer)\b/i,
  },
  {
    id: "tournaments",
    label: "AWC & Tournaments",
    shortLabel: "AWC / Esports",
    pattern: /\b(?:awc|tournament|tournaments|championship|esports|finals|cup|circuit|blizzcon)\b/i,
  },
];

export function detectArticleClasses(article: {
  title: string;
  summary: string;
  pvpExcerpt?: string;
}): WowClassInfo[] {
  const text = `${article.title} ${article.summary} ${article.pvpExcerpt ?? ""}`;
  return WOW_CLASSES.filter((cls) => cls.pattern.test(text));
}

export function matchesTopic(
  article: { title: string; summary: string; pvpExcerpt?: string },
  topicId: string,
): boolean {
  if (topicId === "all") return true;
  const topic = PVP_TOPICS.find((t) => t.id === topicId);
  if (!topic) return true;
  const text = `${article.title} ${article.summary} ${article.pvpExcerpt ?? ""}`;
  return topic.pattern.test(text);
}
