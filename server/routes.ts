import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRehearsalSchema, insertTaskSchema, insertGigSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Rehearsals routes (protected)
  app.get("/api/rehearsals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rehearsals = await storage.getRehearsals(userId);
      res.json(rehearsals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rehearsals" });
    }
  });

  app.get("/api/rehearsals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rehearsal = await storage.getRehearsal(req.params.id, userId);
      if (!rehearsal) {
        return res.status(404).json({ message: "Rehearsal not found" });
      }
      res.json(rehearsal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rehearsal" });
    }
  });

  app.post("/api/rehearsals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertRehearsalSchema.parse(req.body);
      const rehearsal = await storage.createRehearsal(validatedData, userId);
      res.status(201).json(rehearsal);
    } catch (error) {
      res.status(400).json({ message: "Invalid rehearsal data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/rehearsals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertRehearsalSchema.partial().parse(req.body);
      // Remove userId to prevent ownership tampering
      const { userId: _, ...safeData } = validatedData as any;
      const rehearsal = await storage.updateRehearsal(req.params.id, safeData, userId);
      if (!rehearsal) {
        return res.status(404).json({ message: "Rehearsal not found" });
      }
      res.json(rehearsal);
    } catch (error) {
      res.status(400).json({ message: "Invalid rehearsal data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/rehearsals/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteRehearsal(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Rehearsal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rehearsal" });
    }
  });

  // Tasks routes (protected)
  app.post("/api/rehearsals/:rehearsalId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        rehearsalId: req.params.rehearsalId,
      });
      const task = await storage.createTask(validatedData, userId);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTaskSchema.partial().parse(req.body);
      // Remove userId and rehearsalId to prevent tampering
      const { userId: _, rehearsalId: __, ...safeData } = validatedData as any;
      const task = await storage.updateTask(req.params.id, safeData, userId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteTask(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.post("/api/rehearsals/:rehearsalId/tasks/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { taskIds } = req.body;
      if (!Array.isArray(taskIds)) {
        return res.status(400).json({ message: "taskIds must be an array" });
      }
      const tasks = await storage.reorderTasks(req.params.rehearsalId, taskIds, userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder tasks" });
    }
  });

  // Gigs routes (protected)
  app.get("/api/gigs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gigs = await storage.getGigs(userId);
      res.json(gigs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gigs" });
    }
  });

  app.get("/api/gigs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gig = await storage.getGig(req.params.id, userId);
      if (!gig) {
        return res.status(404).json({ message: "Gig not found" });
      }
      res.json(gig);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gig" });
    }
  });

  app.post("/api/gigs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertGigSchema.parse(req.body);
      const gig = await storage.createGig(validatedData, userId);
      res.status(201).json(gig);
    } catch (error) {
      res.status(400).json({ message: "Invalid gig data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/gigs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertGigSchema.partial().parse(req.body);
      // Remove userId to prevent ownership tampering
      const { userId: _, ...safeData } = validatedData as any;
      const gig = await storage.updateGig(req.params.id, safeData, userId);
      if (!gig) {
        return res.status(404).json({ message: "Gig not found" });
      }
      res.json(gig);
    } catch (error) {
      res.status(400).json({ message: "Invalid gig data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/gigs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await storage.deleteGig(req.params.id, userId);
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
