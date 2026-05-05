import type { Database } from "sqlite";

export async function initDatabase(db: Database) {
  await db.exec(`
    create table if not exists users (
      id text primary key,
      email text not null unique,
      password_hash text not null,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists practice_sessions (
      id text primary key,
      user_id text not null,
      mode text not null,
      category text not null,
      duration_ms integer not null,
      total_chars integer not null,
      correct_chars integer not null,
      error_count integer not null,
      wpm integer not null,
      accuracy integer not null,
      valid integer not null,
      created_at text not null
    );

    create table if not exists user_achievements (
      user_id text not null,
      achievement_id text not null,
      progress integer not null,
      unlocked integer not null,
      unlocked_at text,
      updated_at text not null,
      primary key (user_id, achievement_id)
    );

    create table if not exists daily_challenge_progress (
      user_id text not null,
      date_key text not null,
      challenge_id text not null,
      completed integer not null,
      best_wpm integer not null,
      best_accuracy integer not null,
      updated_at text not null,
      primary key (user_id, date_key)
    );
  `);
}
