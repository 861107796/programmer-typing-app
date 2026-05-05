import type { Database } from "sqlite";

export interface ChallengeAssignmentRecord {
  date_key: string;
  content_item_id: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export function createChallengeAssignmentRepository(db: Database) {
  return {
    async listByDate(dateKey: string) {
      return db.all<ChallengeAssignmentRecord[]>(
        `select * from daily_challenge_assignments where date_key = ?`,
        dateKey,
      );
    },

    async getByDate(dateKey: string) {
      return (
        (await db.get<ChallengeAssignmentRecord>(
          `select * from daily_challenge_assignments where date_key = ?`,
          dateKey,
        )) ?? null
      );
    },

    async upsert(
      dateKey: string,
      contentItemId: string,
      source: "manual" | "generated",
    ) {
      const now = new Date().toISOString();

      await db.run(
        `insert into daily_challenge_assignments (
          date_key, content_item_id, source, created_at, updated_at
        ) values (?, ?, ?, ?, ?)
        on conflict(date_key) do update set
          content_item_id = excluded.content_item_id,
          source = excluded.source,
          updated_at = excluded.updated_at`,
        dateKey,
        contentItemId,
        source,
        now,
        now,
      );

      return this.getByDate(dateKey);
    },

    async isContentAssigned(contentItemId: string) {
      const row = await db.get<{ count: number }>(
        `select count(*) as count from daily_challenge_assignments where content_item_id = ?`,
        contentItemId,
      );

      return (row?.count ?? 0) > 0;
    },

    async listRecent(limit = 7) {
      return db.all<ChallengeAssignmentRecord[]>(
        `select * from daily_challenge_assignments order by date_key desc limit ?`,
        limit,
      );
    },
  };
}
