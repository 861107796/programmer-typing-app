export type PracticeCategory = "code" | "command" | "technical";
export type PracticeMode = "mixed" | "focused" | "daily";

export interface ContentItem {
  id: string;
  category: PracticeCategory;
  label: string;
  prompt: string;
}

export interface DailyChallenge {
  dateKey: string;
  content: ContentItem;
}

export interface SessionResult {
  mode: PracticeMode;
  category: PracticeCategory | "mixed";
  durationMs: number;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  wpm: number;
  accuracy: number;
  valid: boolean;
}

export interface StoredDailyChallenge {
  dateKey: string;
  challengeId: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
}
