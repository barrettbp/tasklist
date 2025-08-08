import { tasks, type Task, type InsertTask } from "@shared/schema";

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Push subscription management
  savePushSubscription(subscription: PushSubscription): Promise<void>;
  getPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<boolean>;
}

// Helper function for easy access
export function getMemStorage(): MemStorage {
  return new MemStorage();
}

export class MemStorage implements IStorage {
  private tasks: Map<number, Task>;
  private currentId: number;
  private pushSubscriptions: Set<PushSubscription>;

  constructor() {
    this.tasks = new Map();
    this.currentId = 1;
    this.pushSubscriptions = new Set();
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const task: Task = { 
      ...insertTask, 
      id,
      isInterval: insertTask.isInterval || false,
      parentTaskId: insertTask.parentTaskId || null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    
    const updated: Task = { ...existing, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async savePushSubscription(subscription: PushSubscription): Promise<void> {
    // Remove existing subscription with same endpoint first
    this.pushSubscriptions.forEach(sub => {
      if (sub.endpoint === subscription.endpoint) {
        this.pushSubscriptions.delete(sub);
      }
    });
    this.pushSubscriptions.add(subscription);
  }

  async getPushSubscriptions(): Promise<PushSubscription[]> {
    return Array.from(this.pushSubscriptions);
  }

  async deletePushSubscription(endpoint: string): Promise<boolean> {
    const existing = Array.from(this.pushSubscriptions).find(sub => sub.endpoint === endpoint);
    if (existing) {
      return this.pushSubscriptions.delete(existing);
    }
    return false;
  }
}

export const storage = new MemStorage();
