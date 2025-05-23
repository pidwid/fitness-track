import {
  createClient,
  LibsqlError,
  type Client,
  type ResultSet,
  type Row,
  type Transaction,
} from "@libsql/client";
import { env } from "../config.js";

// Turso configuration
const tursoConfig = {
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
};

let dbClient: Client | null = null;

// Create or connect to the database
export const getDatabase = (): Client => {
  if (!tursoConfig.url) {
    throw new Error("TURSO_DATABASE_URL is not set.");
  }
  if (!tursoConfig.authToken && !tursoConfig.url.startsWith("file:")) {
    // Allow missing authToken for local file URLs, but error for remote non-file URLs
    if (
      !tursoConfig.url.includes("localhost") &&
      !tursoConfig.url.includes("127.0.0.1")
    ) {
      console.warn(
        "TURSO_AUTH_TOKEN is not set. This is required for remote Turso databases.",
      );
      // throw new Error("TURSO_AUTH_TOKEN is not set."); // Or just warn and let it try
    }
  }

  if (!dbClient) {
    dbClient = createClient({
      url: tursoConfig.url,
      authToken: tursoConfig.authToken,
    });
  }
  return dbClient;
};

// Initialize the database with tables
export const initializeDatabase = async (): Promise<void> => {
  const db = getDatabase();

  try {
    // Create tables if they don't exist
    // Note: Turso/libSQL might handle `IF NOT EXISTS` slightly differently or might require separate statements.
    // Using batch for DDL statements.
    await db.batch(
      [
        `CREATE TABLE IF NOT EXISTS daily_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        weight REAL,
        calories REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
        `CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        details TEXT,
        entry_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE
      );`,
        `CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);`,
        `CREATE INDEX IF NOT EXISTS idx_exercises_date ON exercises(date);`,
        `CREATE INDEX IF NOT EXISTS idx_exercises_entry_id ON exercises(entry_id);`,
      ],
      "write",
    ); // 'write' mode for DDL statements

    console.log("Database schema initialization attempted successfully");
  } catch (error) {
    if (error instanceof LibsqlError && error.code === "SQLITE_CONSTRAINT") {
      // This can happen if tables/indexes already exist and IF NOT EXISTS is not fully supported
      // or if there's another constraint violation during complex initializations.
      console.warn(
        "Warning during database initialization (possibly tables/indexes already exist):",
        error.message,
      );
    } else if (
      error instanceof LibsqlError &&
      error.message.includes("already exists")
    ) {
      console.warn(
        "Warning during database initialization (table/index already exists):",
        error.message,
      );
    } else {
      console.error("Error initializing database:", error);
      throw error; // Re-throw if it's not a "table already exists" type error
    }
  }
};

// Define interfaces for row data for better type safety
export interface DailyEntryRow extends Row {
  id: number;
  date: string;
  weight?: number | null;
  calories?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseRow extends Row {
  id: number;
  date: string;
  type: string;
  details?: string | null;
  entry_id: number;
  created_at: string;
  updated_at: string;
}

// Export models for use in route handlers
export const models = {
  // Daily entries
  getDailyEntries: async (): Promise<DailyEntryRow[]> => {
    const db = getDatabase();
    const rs = await db.execute(
      "SELECT * FROM daily_entries ORDER BY date DESC",
    );
    return rs.rows as DailyEntryRow[];
  },

  getDailyEntryByDate: async (
    date: string,
  ): Promise<DailyEntryRow | undefined> => {
    const db = getDatabase();
    const rs = await db.execute({
      sql: "SELECT * FROM daily_entries WHERE date = ?",
      args: [date],
    });
    return rs.rows[0] as DailyEntryRow | undefined;
  },

  getDailyEntryById: async (id: number): Promise<DailyEntryRow | undefined> => {
    const db = getDatabase();
    const rs = await db.execute({
      sql: "SELECT * FROM daily_entries WHERE id = ?",
      args: [id],
    });
    return rs.rows[0] as DailyEntryRow | undefined;
  },

  addDailyEntry: async (
    date: string,
    weight?: number,
    calories?: number,
  ): Promise<ResultSet> => {
    const db = getDatabase();
    return db.execute({
      sql: "INSERT INTO daily_entries (date, weight, calories) VALUES (?, ?, ?)",
      args: [date, weight ?? null, calories ?? null],
    });
  },

  updateDailyEntry: async (
    id: number,
    weight?: number,
    calories?: number,
  ): Promise<ResultSet> => {
    const db = getDatabase();
    return db.execute({
      sql: "UPDATE daily_entries SET weight = ?, calories = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [weight ?? null, calories ?? null, id],
    });
  },

  deleteDailyEntry: async (id: number): Promise<ResultSet> => {
    const db = getDatabase();
    return db.execute({
      sql: "DELETE FROM daily_entries WHERE id = ?",
      args: [id],
    });
  },

  // Exercises
  getExercisesByEntryId: async (entryId: number): Promise<ExerciseRow[]> => {
    const db = getDatabase();
    const rs = await db.execute({
      sql: "SELECT * FROM exercises WHERE entry_id = ?",
      args: [entryId],
    });
    return rs.rows as ExerciseRow[];
  },

  getExercisesByDate: async (date: string): Promise<ExerciseRow[]> => {
    const db = getDatabase();
    const rs = await db.execute({
      sql: "SELECT * FROM exercises WHERE date = ?",
      args: [date],
    });
    return rs.rows as ExerciseRow[];
  },

  addExercise: async (
    date: string,
    type: string,
    details: string,
    entryId: number,
  ): Promise<ResultSet> => {
    const db = getDatabase();
    return db.execute({
      sql: "INSERT INTO exercises (date, type, details, entry_id) VALUES (?, ?, ?, ?)",
      args: [date, type, details, entryId],
    });
  },

  updateExercise: async (
    id: number,
    type: string,
    details: string,
  ): Promise<ResultSet> => {
    const db = getDatabase();
    return db.execute({
      sql: "UPDATE exercises SET type = ?, details = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [type, details, id],
    });
  },

  deleteExercise: async (id: number): Promise<ResultSet> => {
    const db = getDatabase();
    return db.execute({
      sql: "DELETE FROM exercises WHERE id = ?",
      args: [id],
    });
  },

  // Data export
  exportData: async (): Promise<any[]> => {
    const db = getDatabase();
    const entriesResult = await db.execute(
      "SELECT * FROM daily_entries ORDER BY date",
    );
    const dailyEntries = entriesResult.rows as DailyEntryRow[];

    const result = [];
    for (const entry of dailyEntries) {
      const exercisesResult = await db.execute({
        sql: "SELECT * FROM exercises WHERE entry_id = ?",
        args: [entry.id],
      });
      result.push({
        ...entry,
        exercises: exercisesResult.rows as ExerciseRow[],
      });
    }
    return result;
  },

  // Data import (for backup restoration)
  importData: async (
    data: any[],
  ): Promise<{ success: boolean; count: number }> => {
    const db = getDatabase();

    await db.transaction(async (tx: Transaction) => {
      await tx.execute("DELETE FROM exercises");
      await tx.execute("DELETE FROM daily_entries"); // Resetting sequence might be needed for some SQL dbs, but AUTOINCREMENT handles it.

      for (const entry of data) {
        await tx.execute({
          sql: "INSERT INTO daily_entries (id, date, weight, calories, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
          args: [
            entry.id,
            entry.date,
            entry.weight ?? null,
            entry.calories ?? null,
            entry.created_at || new Date().toISOString(),
            entry.updated_at || new Date().toISOString(),
          ],
        });

        if (entry.exercises && Array.isArray(entry.exercises)) {
          for (const exercise of entry.exercises) {
            await tx.execute({
              sql: "INSERT INTO exercises (id, date, type, details, entry_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
              args: [
                exercise.id, // Assuming IDs are preserved
                exercise.date,
                exercise.type,
                exercise.details ?? null,
                exercise.entry_id, // This should match the entry.id above
                exercise.created_at || new Date().toISOString(),
                exercise.updated_at || new Date().toISOString(),
              ],
            });
          }
        }
      }
    });

    return { success: true, count: data.length };
  },
};
