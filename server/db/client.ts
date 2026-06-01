import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function createDatabase(databasePath: string) {
  if (databasePath !== ":memory:") {
    await mkdir(dirname(databasePath), { recursive: true });
  }

  return open({
    filename: databasePath,
    driver: sqlite3.Database,
  });
}
