import { openDB } from 'idb';

// Define types for our database models
export interface ExerciseEntry {
  id?: number;
  date: string;
  type: string;
  details: string;
  entryId: number;
}

export interface DailyEntry {
  id?: number;
  date: string;
  weight?: number;
  calories?: number;
}

export interface AppDBSchema extends DBSchema {
  daily_entries: {
    key: number;
    value: DailyEntry;
    indexes: { 'by-date': string };
  };
  exercises: {
    key: number;
    value: ExerciseEntry;
    indexes: { 'by-date': string; 'by-entry': number };
  };
}

// Initialize the database
export const initDB = async () => {
  const db = await openDB<AppDBSchema>('fitness-tracker', 1, {
    upgrade(db) {
      // Create daily entries store
      const dailyStore = db.createObjectStore('daily_entries', {
        keyPath: 'id',
        autoIncrement: true,
      });
      dailyStore.createIndex('by-date', 'date');

      // Create exercises store
      const exercisesStore = db.createObjectStore('exercises', {
        keyPath: 'id',
        autoIncrement: true,
      });
      exercisesStore.createIndex('by-date', 'date');
      exercisesStore.createIndex('by-entry', 'entryId');
    },
  });

  return db;
};

// Get the database instance
export const getDB = async () => {
  return await openDB<AppDBSchema>('fitness-tracker', 1);
};

// Add a new daily entry
export const addDailyEntry = async (entry: DailyEntry): Promise<number> => {
  const db = await getDB();
  return await db.add('daily_entries', entry);
};

// Update a daily entry
export const updateDailyEntry = async (entry: DailyEntry): Promise<number> => {
  const db = await getDB();
  return await db.put('daily_entries', entry);
};

// Get all daily entries
export const getAllDailyEntries = async (): Promise<DailyEntry[]> => {
  const db = await getDB();
  return await db.getAllFromIndex('daily_entries', 'by-date');
};

// Get a daily entry by date
export const getDailyEntryByDate = async (date: string): Promise<DailyEntry | undefined> => {
  const db = await getDB();
  const entries = await db.getAllFromIndex('daily_entries', 'by-date', date);
  return entries[0];
};

// Add a new exercise
export const addExercise = async (exercise: ExerciseEntry): Promise<number> => {
  const db = await getDB();
  return await db.add('exercises', exercise);
};

// Update an exercise
export const updateExercise = async (exercise: ExerciseEntry): Promise<number> => {
  const db = await getDB();
  return await db.put('exercises', exercise);
};

// Get exercises by daily entry id
export const getExercisesByEntryId = async (entryId: number): Promise<ExerciseEntry[]> => {
  const db = await getDB();
  return await db.getAllFromIndex('exercises', 'by-entry', entryId);
};

// Get exercises by date
export const getExercisesByDate = async (date: string): Promise<ExerciseEntry[]> => {
  const db = await getDB();
  return await db.getAllFromIndex('exercises', 'by-date', date);
};

// Delete a daily entry
export const deleteDailyEntry = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.delete('daily_entries', id);

  // Also delete all associated exercises
  const
