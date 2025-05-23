import express from "express";
import { models } from "../database.ts";

const router = express.Router();

// Get all daily entries
router.get("/", async (req, res) => {
  try {
    const entries = await models.getDailyEntries();
    console.log(entries);
    res.json(entries);
  } catch (error) {
    console.error("Error getting daily entries:", error);
    res.status(500).json({ error: "Failed to get daily entries" });
  }
});

// Get entry by date
router.get("/date/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const entry = await models.getDailyEntryByDate(date);

    if (!entry) {
      return res.status(404).json({ error: "No entry found for this date" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Error getting entry by date:", error);
    res.status(500).json({ error: "Failed to get entry" });
  }
});

// Get entry by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const entry = await models.getDailyEntryById(id);

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Error getting entry by ID:", error);
    res.status(500).json({ error: "Failed to get entry" });
  }
});

// Create a new entry
router.post("/", async (req, res) => {
  try {
    const { date, weight, calories } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    // Check if entry already exists for this date
    const existing = await models.getDailyEntryByDate(date);
    if (existing) {
      return res.status(409).json({
        error: "Entry already exists for this date",
        entryId: existing.id,
      });
    }

    const result = await models.addDailyEntry(date, weight, calories);
    res
      .status(201)
      .json({ id: result.lastInsertRowid, date, weight, calories });
  } catch (error) {
    console.error("Error creating entry:", error);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

// Update an entry
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { weight, calories } = req.body;

    // Check if entry exists
    const entry = await models.getDailyEntryById(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    await models.updateDailyEntry(id, weight, calories);
    res.json({ id, weight, calories });
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ error: "Failed to update entry" });
  }
});

// Delete an entry
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check if entry exists
    const entry = await models.getDailyEntryById(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    await models.deleteDailyEntry(id);
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

// Export and import data - useful for backups
router.get("/export/all", async (req, res) => {
  try {
    const data = await models.exportData();
    res.json(data);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

router.post("/import", async (req, res) => {
  try {
    const data = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const result = await models.importData(data);
    res.json(result);
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).json({ error: "Failed to import data" });
  }
});

export default router;
