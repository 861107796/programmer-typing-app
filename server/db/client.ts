import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import sqlite3 from "sqlite3";
import { open } from "sqlite";

import { config } from "../config";

export async function createDatabase() {
  await mkdir(dirname(config.databasePath), { recursive: true });

  return open({
    filename: config.databasePath,
    driver: sqlite3.Database,
  });
}
