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
  `);
}
