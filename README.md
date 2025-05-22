# Fitness Tracker App

A simple and beautiful fitness tracking application that runs locally on your machine with permanent SQLite storage.

## Features

- **Daily Tracking**: Log your weight, exercises, and calorie consumption
- **Data Visualization**: View progress charts for weight, exercise improvements, and calorie trends
- **Raw Data View**: Access and modify all your fitness data in a tabular format
- **Permanent Storage**: All data is stored securely in a SQLite database file
- **Data Export/Import**: Backup and restore your fitness data as JSON files

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start both the backend and frontend servers:
   ```
   npm run dev:all
   ```
4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Adding Daily Entries

1. On the home page, enter your weight and calories consumed
2. Add one or more exercises by clicking "Add Exercise"
3. For each exercise, enter the type (e.g., "Running", "Push-ups") and details (e.g., "5km in 30 mins", "3 sets of 10")
4. Click "Save Entry" to store your data

### Viewing Progress

1. Navigate to the Dashboard tab
2. View your weight progress over time
3. Select specific exercises to track your improvement
4. Monitor your calorie consumption patterns

### Managing Data

1. Go to the Raw Data tab to see all your entries
2. Edit or delete entries as needed
3. Use the Export button to download a backup of your data
4. Use the Import button to restore data from a backup file

## Data Storage

Your fitness data is stored in a SQLite database file called `fitness-data.db` in the root directory of the project. This file persists your data between sessions and application restarts.

## Technologies Used

- React.js with TypeScript for the frontend
- Express.js for the backend API
- SQLite for permanent data storage
- Tailwind CSS for styling
- Recharts for data visualization

## License

This project is licensed under the MIT License