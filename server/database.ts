import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path - stored in the project root
const dbPath = path.join(__dirname, '../fitness-data.db');

// Create a directory if it doesn't exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Ensure the parent directory exists
ensureDirectoryExists(path.dirname(dbPath));

// Create or connect to the database
export const getDatabase = () => {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Better performance and reliability
  return db;
};

// Initialize the database with tables
export const initializeDatabase = () => {
  const db = getDatabase();

  // Create tables if they don't exist
  db.exec(`
    -- Daily entries table
    CREATE TABLE IF NOT EXISTS daily_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      weight REAL,
      calories REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Exercises table
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      details TEXT,
      entry_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE
    );

    -- Create date index for faster queries
    CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
    CREATE INDEX IF NOT EXISTS idx_exercises_date ON exercises(date);
    CREATE INDEX IF NOT EXISTS idx_exercises_entry_id ON exercises(entry_id);
  `);

  console.log('Database initialized successfully');
  return db;
};

// Export models for use in route handlers
export const models = {
  // Daily entries
  getDailyEntries: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM daily_entries ORDER BY date DESC').all();
  },

  getDailyEntryByDate: (date: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM daily_entries WHERE date = ?').get(date);
  },

  getDailyEntryById: (id: number) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM daily_entries WHERE id = ?').get(id);
  },

  addDailyEntry: (date: string, weight?: number, calories?: number) => {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO daily_entries (date, weight, calories) VALUES (?, ?, ?)'
    );
    return stmt.run(date, weight || null, calories || null);
  },

  updateDailyEntry: (id: number, weight?: number, calories?: number) => {
    const db = getDatabase();
    const stmt = db.prepare(
      'UPDATE daily_entries SET weight = ?, calories = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    return stmt.run(weight || null, calories || null, id);
  },

  deleteDailyEntry: (id: number) => {
    const db = getDatabase();
    return db.prepare('DELETE FROM daily_entries WHERE id = ?').run(id);
  },

  // Exercises
  getExercisesByEntryId: (entryId: number) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM exercises WHERE entry_id = ?').all(entryId);
  },

  getExercisesByDate: (date: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM exercises WHERE date = ?').all(date);
  },

  addExercise: (date: string, type: string, details: string, entryId: number) => {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO exercises (date, type, details, entry_id) VALUES (?, ?, ?, ?)'
    );
    return stmt.run(date, type, details, entryId);
  },

  updateExercise: (id: number, type: string, details: string) => {
    const db = getDatabase();
    const stmt = db.prepare(
      'UPDATE exercises SET type = ?, details = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );
    return stmt.run(type, details, id);
  },

  deleteExercise: (id: number) => {
    const db = getDatabase();
    return db.prepare('DELETE FROM exercises WHERE id = ?').run(id);
  },

  // Data export
  exportData: () => {
    const db = getDatabase();
    const dailyEntries = db.prepare('SELECT * FROM daily_entries ORDER BY date').all();
    
    // Get exercises for each entry
    const result = dailyEntries.map(entry => {
      const exercises = db.prepare('SELECT * FROM exercises WHERE entry_id = ?').all(entry.id);
      return {
        ...entry,
        exercises
      };
    });
    
    return result;
  },

  // Data import (for backup restoration)
  importData: (data: any[]) => {
    const db = getDatabase();
    
    // Begin transaction
    const transaction = db.transaction((data) => {
      // Clear existing data
      db.prepare('DELETE FROM exercises').run();
      db.prepare('DELETE FROM daily_entries').run();
      
      // Insert new data
      const insertEntry = db.prepare(
        'INSERT INTO daily_entries (id, date, weight, calories, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      );
      
      const insertExercise = db.prepare(
        'INSERT INTO exercises (id, date, type, details, entry_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      
      for (const entry of data) {
        insertEntry.run(
          entry.id, 
          entry.date, 
          entry.weight, 
          entry.calories,
          entry.created_at || new Date().toISOString(),
          entry.updated_at || new Date().toISOString()
        );
        
        if (entry.exercises && Array.isArray(entry.exercises)) {
          for (const exercise of entry.exercises) {
            insertExercise.run(
              exercise.id,
              exercise.date,
              exercise.type,
              exercise.details,
              exercise.entry_id,
              exercise.created_at || new Date().toISOString(),
              exercise.updated_at || new Date().toISOString()
            );
          }
        }
      }
    });
    
    transaction(data);
    return { success: true, count: data.length };
  }
};