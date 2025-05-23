import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  fetchDailyEntryByDate,
  fetchExercisesByEntryId,
  createDailyEntry,
  updateDailyEntry,
  createExercise,
  updateExercise,
  deleteExercise,
  type DailyEntry,
  type ExerciseEntry
} from '../api';

const DataEntryForm = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [exercises, setExercises] = useState<Array<{ type: string; details: string; id?: number }>>([
    { type: '', details: '' }
  ]);
  const [dailyEntryId, setDailyEntryId] = useState<number | null>(null);
  
  // Load existing data for selected date
  useEffect(() => {
    const loadDailyData = async () => {
      try {
        const dailyEntry = await fetchDailyEntryByDate(date);
        
        if (dailyEntry) {
          setWeight(dailyEntry.weight?.toString() || '');
          setCalories(dailyEntry.calories?.toString() || '');
          setDailyEntryId(dailyEntry.id || null);
          
          if (dailyEntry.id) {
            const exerciseEntries = await fetchExercisesByEntryId(dailyEntry.id);
            if (exerciseEntries.length > 0) {
              setExercises(exerciseEntries.map(e => ({
                type: e.type,
                details: e.details,
                id: e.id
              })));
            } else {
              setExercises([{ type: '', details: '' }]);
            }
          }
        } else {
          // Reset form for new date
          setWeight('');
          setCalories('');
          setExercises([{ type: '', details: '' }]);
          setDailyEntryId(null);
        }
      } catch (error) {
        console.error('Error loading daily data:', error);
        toast.error('Failed to load data for selected date');
      }
    };
    
    loadDailyData();
  }, [date]);
  
  const handleExerciseChange = (index: number, field: 'type' | 'details', value: string) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setExercises(updatedExercises);
  };
  
  const addExerciseField = () => {
    setExercises([...exercises, { type: '', details: '' }]);
  };
  
  const removeExerciseField = async (index: number) => {
    const exerciseToRemove = exercises[index];
    
    if (exerciseToRemove.id && dailyEntryId) {
      try {
        await deleteExercise(exerciseToRemove.id);
        toast.success('Exercise removed');
      } catch (error) {
        console.error('Error removing exercise:', error);
        toast.error('Failed to remove exercise');
        return;
      }
    }
    
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises.length ? updatedExercises : [{ type: '', details: '' }]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create or update daily entry
      const dailyEntry: DailyEntry = {
        date,
        weight: weight ? parseFloat(weight) : undefined,
        calories: calories ? parseFloat(calories) : undefined,
      };
      
      let entryId: number;
      
      if (dailyEntryId) {
        dailyEntry.id = dailyEntryId;
        await updateDailyEntry(dailyEntry);
        entryId = dailyEntryId;
        toast.success('Daily entry updated');
      } else {
        const newEntry = await createDailyEntry(dailyEntry);
        entryId = newEntry.id as number;
        setDailyEntryId(entryId);
        toast.success('Daily entry saved');
      }
      
      // Handle exercises
      for (const exercise of exercises) {
        // Only save exercises with a non-empty type (required field)
        if (exercise.type.trim()) {
          const exerciseEntry: ExerciseEntry = {
            date,
            type: exercise.type.trim(),
            details: exercise.details.trim(),
            entry_id: entryId
          };
          
          if (exercise.id) {
            exerciseEntry.id = exercise.id;
            await updateExercise(exerciseEntry);
          } else {
            await createExercise(exerciseEntry);
          }
        }
      }
      
      toast.success('Data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data');
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Daily Fitness Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter your weight"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Enter calories consumed"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Exercises</h3>
            <button
              type="button"
              onClick={addExerciseField}
              className="bg-primary text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Exercise
            </button>
          </div>
          
          {exercises.map((exercise, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Exercise #{index + 1}</h4>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExerciseField(index)}
                    className="text-danger hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    value={exercise.type}
                    onChange={(e) => handleExerciseChange(index, 'type', e.target.value)}
                    placeholder="e.g., Running, Push-ups"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                  <input
                    type="text"
                    value={exercise.details}
                    onChange={(e) => handleExerciseChange(index, 'details', e.target.value)}
                    placeholder="e.g., 5km in 30 mins, 3 sets of 10"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-success text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Save Entry
          </button>
        </div>
      </form>
    </div>
  );
};

export default DataEntryForm;