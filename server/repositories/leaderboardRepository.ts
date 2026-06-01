import type { Database } from "sqlite";

export interface LeaderboardEntryRow {
  user_id: string;
  email: string;
  wpm: number;
  accuracy: number;
  recorded_at: string;
}

export interface LeaderboardRankRow extends LeaderboardEntryRow {
  rank: number;
}

export function createLeaderboardRepository(db: Database) {
  return {
    async listDailyTop(dateKey: string, limit = 100) {
      return db.all<LeaderboardEntryRow[]>(
        `select
           d.user_id,
           u.email,
           d.best_wpm as wpm,
           d.best_accuracy as accuracy,
           d.updated_at as recorded_at
         from daily_challenge_progress d
         join users u on u.id = d.user_id
         where d.date_key = ? and d.completed = 1
         order by d.best_wpm desc, d.best_accuracy desc, d.updated_at asc
         limit ?`,
        dateKey,
        limit,
      );
    },

    async listGlobalTop(limit = 100) {
      return db.all<LeaderboardEntryRow[]>(
        `with ranked_sessions as (
           select
             s.user_id,
             u.email,
             s.wpm,
             s.accuracy,
             s.created_at as recorded_at,
             row_number() over (
               partition by s.user_id
               order by s.wpm desc, s.accuracy desc, s.created_at asc
             ) as session_rank
           from practice_sessions s
           join users u on u.id = s.user_id
           where s.valid = 1
         )
         select user_id, email, wpm, accuracy, recorded_at
         from ranked_sessions
         where session_rank = 1
         order by wpm desc, accuracy desc, recorded_at asc
         limit ?`,
        limit,
      );
    },

    async getDailyRankForUser(userId: string, dateKey: string) {
      return (
        (await db.get<LeaderboardRankRow>(
          `with ranked_daily as (
             select
               d.user_id,
               u.email,
               d.best_wpm as wpm,
               d.best_accuracy as accuracy,
               d.updated_at as recorded_at,
               row_number() over (
                 order by d.best_wpm desc, d.best_accuracy desc, d.updated_at asc
               ) as rank
             from daily_challenge_progress d
             join users u on u.id = d.user_id
             where d.date_key = ? and d.completed = 1
           )
           select user_id, email, wpm, accuracy, recorded_at, rank
           from ranked_daily
           where user_id = ?`,
          dateKey,
          userId,
        )) ?? null
      );
    },

    async getGlobalRankForUser(userId: string) {
      return (
        (await db.get<LeaderboardRankRow>(
          `with best_sessions as (
             select
               s.user_id,
               u.email,
               s.wpm,
               s.accuracy,
               s.created_at as recorded_at,
               row_number() over (
                 partition by s.user_id
                 order by s.wpm desc, s.accuracy desc, s.created_at asc
               ) as session_rank
             from practice_sessions s
             join users u on u.id = s.user_id
             where s.valid = 1
           ),
           ranked_global as (
             select
               user_id,
               email,
               wpm,
               accuracy,
               recorded_at,
               row_number() over (
                 order by wpm desc, accuracy desc, recorded_at asc
               ) as rank
             from best_sessions
             where session_rank = 1
           )
           select user_id, email, wpm, accuracy, recorded_at, rank
           from ranked_global
           where user_id = ?`,
          userId,
        )) ?? null
      );
    },
  };
}
