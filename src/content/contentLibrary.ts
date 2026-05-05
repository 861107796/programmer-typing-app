import type {
  ContentItem,
  DailyChallenge,
  PracticeCategory,
} from "../domain/types";

const CONTENT: ContentItem[] = [
  {
    id: "code-01",
    category: "code",
    label: "TypeScript function",
    prompt:
      "const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));",
  },
  {
    id: "code-02",
    category: "code",
    label: "Object mapping",
    prompt:
      "const userMap = users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {});",
  },
  {
    id: "code-03",
    category: "code",
    label: "Async handler",
    prompt:
      "async function loadUser(id: string) { return fetch(`/api/users/${id}`).then((res) => res.json()); }",
  },
  {
    id: "code-04",
    category: "code",
    label: "Guard clause",
    prompt: "if (!config?.token) throw new Error(\"Missing API token\");",
  },
  {
    id: "command-01",
    category: "command",
    label: "Git cleanup",
    prompt: "git fetch origin --prune && git status --short --branch",
  },
  {
    id: "command-02",
    category: "command",
    label: "Node script",
    prompt: "npm run build -- --mode production",
  },
  {
    id: "command-03",
    category: "command",
    label: "Ripgrep search",
    prompt: "rg --glob '!dist' --glob '!node_modules' \"useTypingSession\" src",
  },
  {
    id: "command-04",
    category: "command",
    label: "Docker logs",
    prompt: "docker logs web --tail 100 | Select-String \"ERROR\"",
  },
  {
    id: "technical-01",
    category: "technical",
    label: "API sentence",
    prompt:
      "The handler should return a cached response when the upstream request times out.",
  },
  {
    id: "technical-02",
    category: "technical",
    label: "Docs sentence",
    prompt:
      "Refactor the parser so each token transformation can be tested in isolation.",
  },
  {
    id: "technical-03",
    category: "technical",
    label: "Infra sentence",
    prompt:
      "Monitor the deployment until error rates stabilize below the alert threshold.",
  },
  {
    id: "technical-04",
    category: "technical",
    label: "Review sentence",
    prompt:
      "Prefer smaller modules when the current component mixes state, rendering, and side effects.",
  },
];

export function getContentByCategory(category: PracticeCategory): ContentItem[] {
  return CONTENT.filter((item) => item.category === category);
}

export function getMixedPracticeSet(count: number): ContentItem[] {
  const grouped: Record<PracticeCategory, ContentItem[]> = {
    code: getContentByCategory("code"),
    command: getContentByCategory("command"),
    technical: getContentByCategory("technical"),
  };
  const order: PracticeCategory[] = ["code", "command", "technical"];
  const items: ContentItem[] = [];

  for (let index = 0; index < count; index += 1) {
    const category = order[index % order.length];
    const pool = grouped[category];
    items.push(pool[Math.floor(index / order.length) % pool.length]);
  }

  return items;
}

export function getDailyChallenge(dateKey: string): DailyChallenge {
  const hash = [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    dateKey,
    content: CONTENT[hash % CONTENT.length],
  };
}
