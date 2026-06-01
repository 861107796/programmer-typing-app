export type PracticeCategory = "code" | "command" | "technical";
export type PracticeMode = "mixed" | "focused" | "daily";
export type PracticeDifficulty = "easy" | "medium" | "hard";
export type PracticeLength = "short" | "medium" | "long";
export type PracticeTopic =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "c"
  | "cpp"
  | "go"
  | "rust"
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
  | "errors"
  | "algorithm"
  | "llm"
  | "ml"
  | "react"
  | "concurrency"
  | "testing"
  | "devops"
  | "security"
  | "database_advanced"
  | "compiler";

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

export interface PersistedSession extends SessionResult {
  id: string;
  createdAt: string;
}

export interface StoredDailyChallenge {
  dateKey: string;
  challengeId: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
}

export interface PersistedAchievement {
  id: string;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface ProgressSnapshotResponse {
  sessions: PersistedSession[];
  achievements: PersistedAchievement[];
  dailyChallenge: StoredDailyChallenge | null;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  wpm: number;
  accuracy: number;
  recordedAt: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

export interface PersonalLeaderboardSummary {
  rank: number;
  displayName: string;
  wpm: number;
  accuracy: number;
  recordedAt: string;
}

export interface PersonalLeaderboardResponse {
  daily: PersonalLeaderboardSummary | null;
  global: PersonalLeaderboardSummary | null;
}

export interface AdminContentItem {
  id: string;
  category: PracticeCategory;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  length: PracticeLength;
  label: string;
  prompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContentListResponse {
  items: AdminContentItem[];
}

export interface AdminChallengeAssignment {
  dateKey: string;
  contentItemId: string;
  source: "manual" | "generated";
}

export interface AdminChallengeListResponse {
  assignments: AdminChallengeAssignment[];
}

export interface BackendDailyChallengeResponse {
  dateKey: string;
  source: "manual" | "generated";
  content: ContentItem;
}
