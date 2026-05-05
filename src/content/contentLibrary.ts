import type {
  ContentItem,
  DailyChallenge,
  PracticeDifficulty,
  PracticeCategory,
  PracticeLength,
  PracticeTopic,
} from "../domain/types";
import { codePrompts } from "./data/code";
import { commandPrompts } from "./data/command";
import { technicalPrompts } from "./data/technical";

export interface ContentFilter {
  category?: PracticeCategory;
  topic?: PracticeTopic;
  difficulty?: PracticeDifficulty;
  length?: PracticeLength;
}

const CONTENT: ContentItem[] = [
  ...codePrompts,
  ...commandPrompts,
  ...technicalPrompts,
];

export function getAllContent(): ContentItem[] {
  return CONTENT;
}

export function filterContent(filter: ContentFilter): ContentItem[] {
  return getAllContent().filter((item) => {
    if (filter.category && item.category !== filter.category) {
      return false;
    }

    if (filter.topic && item.topic !== filter.topic) {
      return false;
    }

    if (filter.difficulty && item.difficulty !== filter.difficulty) {
      return false;
    }

    if (filter.length && item.length !== filter.length) {
      return false;
    }

    return true;
  });
}

export function getContentByCategory(category: PracticeCategory): ContentItem[] {
  return filterContent({ category });
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
    content: getAllContent()[hash % getAllContent().length],
  };
}
