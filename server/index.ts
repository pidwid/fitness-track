import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./database.ts";
import dailyEntriesRouter from "./routes/dailyEntries.ts";
import exercisesRouter from "./routes/exercises.ts";

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the database
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3200;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/daily-entries", dailyEntriesRouter);
app.use("/api/exercises", exercisesRouter);

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
