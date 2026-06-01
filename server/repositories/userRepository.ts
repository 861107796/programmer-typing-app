import { randomUUID } from "node:crypto";

import type { Database } from "sqlite";

import type { UserRecord } from "../types/auth";

export function createUserRepository(db: Database) {
  return {
    async findByEmail(email: string) {
      return db.get<UserRecord>(
        "select * from users where email = ?",
        email,
      );
    },
    async findById(id: string) {
      return db.get<UserRecord>("select * from users where id = ?", id);
    },
    async create(email: string, passwordHash: string) {
      const now = new Date().toISOString();
      const user: UserRecord = {
        id: randomUUID(),
        email,
        password_hash: passwordHash,
        created_at: now,
        updated_at: now,
      };

      await db.run(
        "insert into users (id, email, password_hash, created_at, updated_at) values (?, ?, ?, ?, ?)",
        user.id,
        user.email,
        user.password_hash,
        user.created_at,
        user.updated_at,
      );

      return user;
    },
  };
}
