import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { fetchAllDailyEntries, fetchExercisesByEntryId } from '../api';
import type { DailyEntry, ExerciseEntry } from '../api';

interface ChartData {
  date: string;
  weight?: number;
  calories?: number;
}

interface ExerciseData {
  date: string;
  [key: string]: string | number | undefined;
}

const Dashboard = () => {
  const [weightData, setWeightData] = useState<ChartData[]>([]);
  const [calorieData, setCalorieData] = useState<ChartData[]>([]);
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([]);
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [selectedExerciseType, setSelectedExerciseType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all daily entries
        const entries = await fetchAllDailyEntries();
        
        // Sort by date
        entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Transform data for charts
        const weightChartData: ChartData[] = [];
        const calorieChartData: ChartData[] = [];
        
        // Process entries
        for (const entry of entries) {
          // Format date for display
          const displayDate = format(new Date(entry.date), 'MM/dd');
          
          // Add to weight data if weight exists
          if (entry.weight) {
            weightChartData.push({
              date: displayDate,
              weight: entry.weight
            });
          }
          
          // Add to calorie data if calories exists
          if (entry.calories) {
            calorieChartData.push({
              date: displayDate,
              calories: entry.calories
            });
          }
        }
        
        setWeightData(weightChartData);
        setCalorieData(calorieChartData);
        
        // Process exercise data
        const exerciseMap = new Map<string, number>();
        const exerciseEntries: ExerciseData[] = [];
        
        for (const entry of entries) {
          if (entry.id) {
            const exercises = await fetchExercisesByEntryId(entry.id);
            
            if (exercises.length > 0) {
              const entryDate = format(new Date(entry.date), 'MM/dd');
              const entryData: ExerciseData = { date: entryDate };
              
              for (const exercise of exercises) {
                // Extract numeric values from details (assumes format like "3 sets of 10" or "5km")
                const details = exercise.details;
                const numericMatch = details.match(/(\d+)/);
                const numericValue = numericMatch ? parseInt(numericMatch[0], 10) : undefined;
                
                if (numericValue) {
                  entryData[exercise.type] = numericValue;
                  exerciseMap.set(exercise.type, 1);
                }
              }
              
              if (Object.keys(entryData).length > 1) { // More than just date
                exerciseEntries.push(entryData);
              }
            }
          }
        }
        
        setExerciseData(exerciseEntries);
        const types = Array.from(exerciseMap.keys());
        setExerciseTypes(types);
        
        if (types.length > 0 && !selectedExerciseType) {
          setSelectedExerciseType(types[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard data...</div>;
  }
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Fitness Dashboard</h2>
      
      {/* Weight Progress Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Weight Progress</h3>
        {weightData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weightData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                  name="Weight (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-10">No weight data recorded yet.</p>
        )}
      </div>
      
      {/* Exercise Progress Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Exercise Progress</h3>
          {exerciseTypes.length > 0 && (
            <div>
              <label htmlFor="exercise-select" className="mr-2 text-gray-700">
                Select Exercise:
              </label>
              <select
                id="exercise-select"
                value={selectedExerciseType}
                onChange={(e) => setSelectedExerciseType(e.target.value)}
                className="border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {exerciseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {exerciseData.length > 0 && selectedExerciseType ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={exerciseData.filter(d => d[selectedExerciseType] !== undefined)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey={selectedExerciseType} 
                  fill="#f59e0b"
                  name={selectedExerciseType} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-10">No exercise data recorded yet.</p>
        )}
      </div>
      
      {/* Calorie Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Calorie Consumption</h3>
        {calorieData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={calorieData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="calories" 
                  fill="#10b981" 
                  name="Calories"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-10">No calorie data recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;