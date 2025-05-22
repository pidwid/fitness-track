# Fitness Tracker Installation Guide

This guide will help you set up and run the Fitness Tracker application on your local machine.

## System Requirements

- Node.js (v14 or higher)
- npm (v6 or higher) or yarn

## Installation Steps

### Step 1: Clone or Download the Repository

If you received this as a zip file, extract it to a folder of your choice.

### Step 2: Install Dependencies

Open a terminal or command prompt, navigate to the project directory, and run:

```bash
cd /path/to/Gym
npm install
```

This will install all the necessary dependencies.

### Step 3: Start the Development Server

In the same terminal, run:

```bash
npm run dev:all
```

This command will start both the frontend and backend servers. You'll see output similar to:

```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  
  Server running on port 3000
```

### Step 4: Access the Application

Open your web browser and navigate to:

```
http://localhost:5173
```

You should now see the Fitness Tracker application running.

## Troubleshooting

### If the application fails to start:

1. Make sure Node.js and npm are correctly installed:
   ```bash
   node --version
   npm --version
   ```

2. Try clearing npm cache:
   ```bash
   npm cache clean --force
   npm install
   ```

3. If you encounter errors related to missing modules, try:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Database Issues:

The application uses SQLite for permanent storage. The database file is stored at `fitness-data.db` in the root directory of the project. If you encounter database-related errors:

1. Make sure the backend server is running (you should see "Server running on port 3000" in the console)
2. Check if the database file exists and has proper permissions
3. If necessary, you can delete the database file to reset it (the application will create a new one)

## Data Backup and Restore

You can backup your fitness data at any time:

1. Go to the "Raw Data" page in the application
2. Click the "Export Data" button to download a JSON backup file
3. To restore from a backup, click "Import Data" and select your backup file

## Building for Production

If you want to build the application for production:

```bash
npm run build
```

This will create a `dist` folder with optimized files which can be served by any static file server.