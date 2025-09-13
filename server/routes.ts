import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRehearsalSchema, insertTaskSchema, insertGigSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rehearsals routes
  app.get("/api/rehearsals", async (req, res) => {
    try {
      const rehearsals = await storage.getRehearsals();
      res.json(rehearsals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rehearsals" });
    }
  });

  app.get("/api/rehearsals/:id", async (req, res) => {
    try {
      const rehearsal = await storage.getRehearsal(req.params.id);
      if (!rehearsal) {
        return res.status(404).json({ message: "Rehearsal not found" });
      }
      res.json(rehearsal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rehearsal" });
    }
  });

  app.post("/api/rehearsals", async (req, res) => {
    try {
      const validatedData = insertRehearsalSchema.parse(req.body);
      const rehearsal = await storage.createRehearsal(validatedData);
      res.status(201).json(rehearsal);
    } catch (error) {
      res.status(400).json({ message: "Invalid rehearsal data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/rehearsals/:id", async (req, res) => {
    try {
      const validatedData = insertRehearsalSchema.partial().parse(req.body);
      const rehearsal = await storage.updateRehearsal(req.params.id, validatedData);
      if (!rehearsal) {
        return res.status(404).json({ message: "Rehearsal not found" });
      }
      res.json(rehearsal);
    } catch (error) {
      res.status(400).json({ message: "Invalid rehearsal data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/rehearsals/:id", async (req, res) => {
    try {
      const success = await storage.deleteRehearsal(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Rehearsal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rehearsal" });
    }
  });

  // Tasks routes
  app.post("/api/rehearsals/:rehearsalId/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        rehearsalId: req.params.rehearsalId,
      });
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.post("/api/rehearsals/:rehearsalId/tasks/reorder", async (req, res) => {
    try {
      const { taskIds } = req.body;
      if (!Array.isArray(taskIds)) {
        return res.status(400).json({ message: "taskIds must be an array" });
      }
      const tasks = await storage.reorderTasks(req.params.rehearsalId, taskIds);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder tasks" });
    }
  });

  // Gigs routes
  app.get("/api/gigs", async (req, res) => {
    try {
      const gigs = await storage.getGigs();
      res.json(gigs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gigs" });
    }
  });

  app.get("/api/gigs/:id", async (req, res) => {
    try {
      const gig = await storage.getGig(req.params.id);
      if (!gig) {
        return res.status(404).json({ message: "Gig not found" });
      }
      res.json(gig);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gig" });
    }
  });

  app.post("/api/gigs", async (req, res) => {
    try {
      const validatedData = insertGigSchema.parse(req.body);
      const gig = await storage.createGig(validatedData);
      res.status(201).json(gig);
    } catch (error) {
      res.status(400).json({ message: "Invalid gig data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/gigs/:id", async (req, res) => {
    try {
      const validatedData = insertGigSchema.partial().parse(req.body);
      const gig = await storage.updateGig(req.params.id, validatedData);
      if (!gig) {
        return res.status(404).json({ message: "Gig not found" });
      }
      res.json(gig);
    } catch (error) {
      res.status(400).json({ message: "Invalid gig data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/gigs/:id", async (req, res) => {
    try {
      const success = await storage.deleteGig(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Gig not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gig" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
