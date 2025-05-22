import express from "express";
import { models } from "../database.ts";

const router = express.Router();

// Get exercises by entry ID
router.get("/entry/:entryId", (req, res) => {
  try {
    const entryId = parseInt(req.params.entryId);
    const exercises = models.getExercisesByEntryId(entryId);
    res.json(exercises);
  } catch (error) {
    console.error("Error getting exercises:", error);
    res.status(500).json({ error: "Failed to get exercises" });
  }
});

// Get exercises by date
router.get("/date/:date", (req, res) => {
  try {
    const { date } = req.params;
    const exercises = models.getExercisesByDate(date);
    res.json(exercises);
  } catch (error) {
    console.error("Error getting exercises by date:", error);
    res.status(500).json({ error: "Failed to get exercises" });
  }
});

// Add a new exercise
router.post("/", (req, res) => {
  try {
    const { date, type, details, entryId } = req.body;

    if (!date || !entryId || !type) {
      return res
        .status(400)
        .json({ error: "Date, entry ID, and type are required" });
    }

    const result = models.addExercise(date, type, details || "", entryId);
    res.status(201).json({
      id: result.lastInsertRowid,
      date,
      type,
      details,
      entryId,
    });
  } catch (error) {
    console.error("Error adding exercise:", error);
    res.status(500).json({ error: "Failed to add exercise" });
  }
});

// Update an exercise
router.put("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type, details } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    models.updateExercise(id, type, details || "");
    res.json({ id, type, details });
  } catch (error) {
    console.error("Error updating exercise:", error);
    res.status(500).json({ error: "Failed to update exercise" });
  }
});

// Delete an exercise
router.delete("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    models.deleteExercise(id);
    res.json({ message: "Exercise deleted successfully" });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({ error: "Failed to delete exercise" });
  }
});

export default router;
