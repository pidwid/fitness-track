import { toast } from "sonner";

const API_URL = "http://localhost:3200/api";

// Types
export interface DailyEntry {
  id?: number;
  date: string;
  weight?: number;
  calories?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseEntry {
  id?: number;
  date: string;
  type: string;
  details: string;
  entry_id: number;
  created_at?: string;
  updated_at?: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Error: ${response.status}`);
  }
  return response.json();
};

// Daily Entries
export const fetchAllDailyEntries = async (): Promise<DailyEntry[]> => {
  try {
    const response = await fetch(`${API_URL}/daily-entries`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching daily entries:", error);
    toast.error("Failed to load daily entries");
    return [];
  }
};

export const fetchDailyEntryByDate = async (
  date: string,
): Promise<DailyEntry | null> => {
  try {
    const response = await fetch(`${API_URL}/daily-entries/date/${date}`);
    if (response.status === 404) {
      return null;
    }
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching daily entry:", error);
    toast.error("Failed to load daily entry");
    return null;
  }
};

export const createDailyEntry = async (
  entry: DailyEntry,
): Promise<DailyEntry> => {
  try {
    const response = await fetch(`${API_URL}/daily-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error creating daily entry:", error);
    toast.error("Failed to create daily entry");
    throw error;
  }
};

export const updateDailyEntry = async (
  entry: DailyEntry,
): Promise<DailyEntry> => {
  try {
    if (!entry.id) throw new Error("Entry ID is required for updates");

    const response = await fetch(`${API_URL}/daily-entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weight: entry.weight,
        calories: entry.calories,
      }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error updating daily entry:", error);
    toast.error("Failed to update daily entry");
    throw error;
  }
};

export const deleteDailyEntry = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/daily-entries/${id}`, {
      method: "DELETE",
    });
    await handleResponse(response);
    toast.success("Entry deleted successfully");
  } catch (error) {
    console.error("Error deleting daily entry:", error);
    toast.error("Failed to delete entry");
    throw error;
  }
};

// Exercises
export const fetchExercisesByEntryId = async (
  entryId: number,
): Promise<ExerciseEntry[]> => {
  try {
    const response = await fetch(`${API_URL}/exercises/entry/${entryId}`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    toast.error("Failed to load exercises");
    return [];
  }
};

export const fetchExercisesByDate = async (
  date: string,
): Promise<ExerciseEntry[]> => {
  try {
    const response = await fetch(`${API_URL}/exercises/date/${date}`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching exercises by date:", error);
    toast.error("Failed to load exercises");
    return [];
  }
};

export const createExercise = async (
  exercise: ExerciseEntry,
): Promise<ExerciseEntry> => {
  try {
    const response = await fetch(`${API_URL}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exercise),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error creating exercise:", error);
    toast.error("Failed to create exercise");
    throw error;
  }
};

export const updateExercise = async (
  exercise: ExerciseEntry,
): Promise<ExerciseEntry> => {
  try {
    if (!exercise.id) throw new Error("Exercise ID is required for updates");

    const response = await fetch(`${API_URL}/exercises/${exercise.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: exercise.type,
        details: exercise.details,
      }),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error updating exercise:", error);
    toast.error("Failed to update exercise");
    throw error;
  }
};

export const deleteExercise = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/exercises/${id}`, {
      method: "DELETE",
    });
    await handleResponse(response);
    toast.success("Exercise deleted successfully");
  } catch (error) {
    console.error("Error deleting exercise:", error);
    toast.error("Failed to delete exercise");
    throw error;
  }
};

// Data export and import
export const exportData = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/daily-entries/export/all`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error exporting data:", error);
    toast.error("Failed to export data");
    throw error;
  }
};

export const importData = async (data: any[]): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/daily-entries/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error importing data:", error);
    toast.error("Failed to import data");
    throw error;
  }
};

// Raw data access
export interface RawDataOptions {
  includeMetadata?: boolean;
  format?: 'json' | 'csv';
  startDate?: string;
  endDate?: string;
}

export const fetchRawData = async (options: RawDataOptions = {}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (options.includeMetadata !== undefined) {
      queryParams.append('includeMetadata', options.includeMetadata.toString());
    }
    
    if (options.format) {
      queryParams.append('format', options.format);
    }
    
    if (options.startDate) {
      queryParams.append('startDate', options.startDate);
    }
    
    if (options.endDate) {
      queryParams.append('endDate', options.endDate);
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${API_URL}/raw-data${queryString}`);
    
    // Handle CSV format differently
    if (options.format === 'csv') {
      const text = await response.text();
      return text;
    }
    
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching raw data:", error);
    toast.error("Failed to fetch raw data");
    throw error;
  }
};

export const fetchRawDailyEntries = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/daily-entries/raw`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching raw daily entries:", error);
    toast.error("Failed to load raw daily entries");
    return [];
  }
};

export const fetchRawExercises = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/exercises/raw`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching raw exercises:", error);
    toast.error("Failed to load raw exercises");
    return [];
  }
};

export const fetchFullDataDump = async (): Promise<{dailyEntries: DailyEntry[], exercises: ExerciseEntry[]}> => {
  try {
    const response = await fetch(`${API_URL}/data/dump`);
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching full data dump:", error);
    toast.error("Failed to load complete data set");
    return { dailyEntries: [], exercises: [] };
  }
};
