import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type PushSubscription } from "./storage";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { NotificationService } from "./notifications";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      
      // Set default duration to 25 minutes if not provided
      if (!validatedData.duration) {
        validatedData.duration = 25;
      }
      
      const task = await storage.createTask(validatedData);
      
      // Automatically create a 5-minute interval after the task (unless it's already an interval)
      if (!validatedData.isInterval) {
        const intervalData = {
          name: "Break",
          duration: 5,
          isInterval: true,
          parentTaskId: task.id
        };
        await storage.createTask(intervalData);
      }
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  // Update a task
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const updates = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, updates);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Push notification routes
  
  // Get VAPID public key
  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ publicKey: NotificationService.getVapidPublicKey() });
  });

  // Subscribe to push notifications
  app.post("/api/subscribe", async (req, res) => {
    try {
      const subscriptionSchema = z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string()
        })
      });

      const subscription = subscriptionSchema.parse(req.body) as PushSubscription;
      await storage.savePushSubscription(subscription);
      
      res.status(201).json({ message: "Subscription saved successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save subscription" });
      }
    }
  });

  // Send test notification (for testing purposes)
  app.post("/api/test-notification", async (req, res) => {
    try {
      await NotificationService.sendNotificationToAll({
        title: "Test Notification",
        body: "This is a test push notification!"
      });
      
      res.json({ message: "Test notification sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // Notification endpoints for timer events
  app.post("/api/notify/task-complete", async (req, res) => {
    try {
      const { taskName } = req.body;
      if (!taskName) {
        return res.status(400).json({ message: "Task name is required" });
      }
      
      await NotificationService.sendTaskCompleteNotification(taskName);
      res.json({ message: "Task completion notification sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send task completion notification" });
    }
  });

  app.post("/api/notify/next-task", async (req, res) => {
    try {
      const { taskName } = req.body;
      if (!taskName) {
        return res.status(400).json({ message: "Task name is required" });
      }
      
      await NotificationService.sendNextTaskStartedNotification(taskName);
      res.json({ message: "Next task notification sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send next task notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
