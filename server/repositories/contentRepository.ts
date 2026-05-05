import { randomUUID } from "node:crypto";

import type { Database } from "sqlite";

export interface ContentRecord {
  id: string;
  category: string;
  topic: string;
  difficulty: string;
  length: string;
  label: string;
  prompt: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ContentFilters {
  category?: string;
  topic?: string;
  difficulty?: string;
  length?: string;
  isActive?: boolean;
}

export interface CreateContentInput {
  category: string;
  topic: string;
  difficulty: string;
  length: string;
  label: string;
  prompt: string;
  isActive: boolean;
}

export function createContentRepository(db: Database) {
  return {
    async list(filters: ContentFilters = {}) {
      const clauses: string[] = [];
      const params: Array<string | number> = [];

      if (filters.category) {
        clauses.push("category = ?");
        params.push(filters.category);
      }

      if (filters.topic) {
        clauses.push("topic = ?");
        params.push(filters.topic);
      }

      if (filters.difficulty) {
        clauses.push("difficulty = ?");
        params.push(filters.difficulty);
      }

      if (filters.length) {
        clauses.push("length = ?");
        params.push(filters.length);
      }

      if (typeof filters.isActive === "boolean") {
        clauses.push("is_active = ?");
        params.push(filters.isActive ? 1 : 0);
      }

      const whereClause =
        clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";

      return db.all<ContentRecord[]>(
        `select * from content_items ${whereClause} order by updated_at desc, label asc`,
        ...params,
      );
    },

    async create(input: CreateContentInput) {
      const now = new Date().toISOString();
      const record: ContentRecord = {
        id: randomUUID(),
        category: input.category,
        topic: input.topic,
        difficulty: input.difficulty,
        length: input.length,
        label: input.label,
        prompt: input.prompt,
        is_active: input.isActive ? 1 : 0,
        created_at: now,
        updated_at: now,
      };

      await db.run(
        `insert into content_items (
          id, category, topic, difficulty, length, label, prompt, is_active, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        record.id,
        record.category,
        record.topic,
        record.difficulty,
        record.length,
        record.label,
        record.prompt,
        record.is_active,
        record.created_at,
        record.updated_at,
      );

      return record;
    },

    async findById(id: string) {
      return (
        (await db.get<ContentRecord>(
          `select * from content_items where id = ?`,
          id,
        )) ?? null
      );
    },

    async update(id: string, input: CreateContentInput) {
      const now = new Date().toISOString();

      await db.run(
        `update content_items
         set category = ?, topic = ?, difficulty = ?, length = ?,
             label = ?, prompt = ?, is_active = ?, updated_at = ?
         where id = ?`,
        input.category,
        input.topic,
        input.difficulty,
        input.length,
        input.label,
        input.prompt,
        input.isActive ? 1 : 0,
        now,
        id,
      );

      return this.findById(id);
    },

    async delete(id: string) {
      await db.run(`delete from content_items where id = ?`, id);
    },

    async listActiveByPreference() {
      return db.all<ContentRecord[]>(
        `select * from content_items
         where is_active = 1
         order by
           case category when 'technical' then 0 when 'code' then 1 else 2 end,
           case difficulty when 'medium' then 0 when 'easy' then 1 else 2 end,
           case length when 'medium' then 0 when 'short' then 1 else 2 end,
           updated_at desc`,
      );
    },
  };
}
