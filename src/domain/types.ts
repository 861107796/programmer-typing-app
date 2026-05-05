export type PracticeCategory = "code" | "command" | "technical";
export type PracticeMode = "mixed" | "focused" | "daily";
export type PracticeDifficulty = "easy" | "medium" | "hard";
export type PracticeLength = "short" | "medium" | "long";
export type PracticeTopic =
  | "javascript"
  | "typescript"
  | "python"
  | "sql"
  | "shell"
  | "json"
  | "yaml"
  | "git"
  | "npm"
  | "pip"
  | "filesystem"
  | "search"
  | "docker"
  | "curl"
  | "api"
  | "database"
  | "logging"
  | "deploy"
  | "debugging"
  | "docs"
  | "errors";

export interface ContentItem {
  id: string;
  category: PracticeCategory;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  length: PracticeLength;
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
