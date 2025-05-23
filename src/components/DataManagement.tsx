import { useState, useEffect, Fragment } from "react";
import { toast } from "sonner";
import DataImportExport from "./DataImportExport";
import { Link } from "react-router-dom";
import {
  fetchAllDailyEntries,
  fetchExercisesByEntryId,
  deleteDailyEntry,
  deleteExercise,
  type DailyEntry,
  type ExerciseEntry,
} from "../api";
import { format, parseISO } from "date-fns";

type TabType = "raw-data" | "import-export";

interface EntryWithExercises extends DailyEntry {
  exercises?: ExerciseEntry[];
  expanded?: boolean;
}

const DataManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>("raw-data");
  const [entries, setEntries] = useState<EntryWithExercises[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "raw-data") {
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dailyEntries = await fetchAllDailyEntries();
      if (!!dailyEntries) {
        console.log("No entries found");
      }

      dailyEntries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      const entriesWithExercises: EntryWithExercises[] = [];

      for (const entry of dailyEntries) {
        if (entry.id) {
          const exercises = await fetchExercisesByEntryId(entry.id);
          entriesWithExercises.push({
            ...entry,
            exercises: exercises,
            expanded: false,
          });
        } else {
          entriesWithExercises.push({
            ...entry,
            exercises: [],
            expanded: false,
          });
        }
      }

      setEntries(entriesWithExercises);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    setEntries((prevEntries) => {
      const updated = [...prevEntries];
      updated[index] = {
        ...updated[index],
        expanded: !updated[index].expanded,
      };
      return updated;
    });
  };

  const handleDeleteEntry = async (entryId: number | undefined) => {
    if (!entryId) {
      toast.error("Cannot delete entry without an ID.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete this entry? This will also delete all exercises associated with it.",
      )
    ) {
      return;
    }

    try {
      await deleteDailyEntry(entryId);
      setEntries((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== entryId),
      );
      toast.success("Entry deleted successfully");
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  const handleDeleteExercise = async (
    entryIndex: number,
    exerciseId: number | undefined,
  ) => {
    if (!exerciseId) {
      toast.error("Cannot delete exercise without an ID.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this exercise?")) {
      return;
    }

    try {
      await deleteExercise(exerciseId);

      setEntries((prevEntries) => {
        const updated = [...prevEntries];
        const currentEntry = updated[entryIndex];

        if (currentEntry && currentEntry.exercises) {
          const updatedExercises = currentEntry.exercises.filter(
            (exercise) => exercise.id !== exerciseId,
          );
          updated[entryIndex] = {
            ...currentEntry,
            exercises: updatedExercises,
          };
        }
        return updated;
      });

      toast.success("Exercise deleted successfully");
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast.error("Failed to delete exercise");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // The date from the API is 'YYYY-MM-DD'
      return format(parseISO(dateString + "T00:00:00"), "MMM dd, yyyy");
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Data Management</h2>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "raw-data"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("raw-data")}
        >
          Data Records
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "import-export"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("import-export")}
        >
          Import/Export
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {activeTab === "raw-data" && (
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading data...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No data records found.</p>
                <Link
                  to="/"
                  className="mt-2 inline-block text-primary hover:underline"
                >
                  Add a new entry
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Weight (kg)
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Calories
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Exercises
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry, entryIndex) => (
                      <Fragment key={entry.id || entry.date}>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.weight ?? "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.calories ?? "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.exercises && entry.exercises.length > 0 ? (
                              <button
                                onClick={() => toggleExpand(entryIndex)}
                                className="text-primary hover:underline"
                              >
                                {entry.expanded ? "Hide" : "Show"} (
                                {entry.exercises.length})
                              </button>
                            ) : (
                              "None"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Link
                              to={`/?date=${entry.date}`}
                              className="text-primary hover:text-blue-700"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-danger hover:text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                        {entry.expanded &&
                          entry.exercises &&
                          entry.exercises.length > 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                <div className="pl-4 border-l-2 border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                    Exercises for {formatDate(entry.date)}:
                                  </h4>
                                  <ul className="space-y-2">
                                    {entry.exercises.map(
                                      (exercise, exIndex) => (
                                        <li
                                          key={
                                            exercise.id ||
                                            `${entry.id}-${exIndex}`
                                          }
                                          className="flex justify-between items-center p-2 bg-white rounded shadow-sm"
                                        >
                                          <div>
                                            <span className="font-medium text-gray-800">
                                              {exercise.type}
                                            </span>
                                            :{" "}
                                            <span className="text-gray-600">
                                              {exercise.details}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() =>
                                              handleDeleteExercise(
                                                entryIndex,
                                                exercise.id,
                                              )
                                            }
                                            className="text-danger hover:text-red-700 text-xs"
                                          >
                                            Delete Exercise
                                          </button>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "import-export" && (
          <div className="p-4">
            <DataImportExport />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagement;
