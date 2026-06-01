import { randomUUID } from "node:crypto";

import type { Database } from "sqlite";

export interface SessionRecord {
  id: string;
  user_id: string;
  mode: string;
  category: string;
  duration_ms: number;
  total_chars: number;
  correct_chars: number;
  error_count: number;
  wpm: number;
  accuracy: number;
  valid: number;
  created_at: string;
}

export interface CreateSessionInput {
  mode: string;
  category: string;
  durationMs: number;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  wpm: number;
  accuracy: number;
  valid: boolean;
}

export function createSessionRepository(db: Database) {
  return {
    async create(userId: string, input: CreateSessionInput) {
      const record: SessionRecord = {
        id: randomUUID(),
        user_id: userId,
        mode: input.mode,
        category: input.category,
        duration_ms: input.durationMs,
        total_chars: input.totalChars,
        correct_chars: input.correctChars,
        error_count: input.errorCount,
        wpm: input.wpm,
        accuracy: input.accuracy,
        valid: input.valid ? 1 : 0,
        created_at: new Date().toISOString(),
      };

      await db.run(
        `insert into practice_sessions (
          id, user_id, mode, category, duration_ms, total_chars,
          correct_chars, error_count, wpm, accuracy, valid, created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        record.id,
        record.user_id,
        record.mode,
        record.category,
        record.duration_ms,
        record.total_chars,
        record.correct_chars,
        record.error_count,
        record.wpm,
        record.accuracy,
        record.valid,
        record.created_at,
      );

      return record;
    },
    async listRecentByUser(userId: string) {
      return db.all<SessionRecord[]>(
        `select * from practice_sessions where user_id = ? order by created_at desc limit 20`,
        userId,
      );
    },
  };
}
