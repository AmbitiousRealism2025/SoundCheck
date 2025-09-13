import { type Rehearsal, type Task, type Gig, type InsertRehearsal, type InsertTask, type InsertGig, type RehearsalWithTasks } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Rehearsals
  getRehearsals(): Promise<RehearsalWithTasks[]>;
  getRehearsal(id: string): Promise<RehearsalWithTasks | undefined>;
  createRehearsal(rehearsal: InsertRehearsal): Promise<Rehearsal>;
  updateRehearsal(id: string, rehearsal: Partial<InsertRehearsal>): Promise<Rehearsal | undefined>;
  deleteRehearsal(id: string): Promise<boolean>;

  // Tasks
  getTasks(rehearsalId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  reorderTasks(rehearsalId: string, taskIds: string[]): Promise<Task[]>;

  // Gigs
  getGigs(): Promise<Gig[]>;
  getGig(id: string): Promise<Gig | undefined>;
  createGig(gig: InsertGig): Promise<Gig>;
  updateGig(id: string, gig: Partial<InsertGig>): Promise<Gig | undefined>;
  deleteGig(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private rehearsals: Map<string, Rehearsal>;
  private tasks: Map<string, Task>;
  private gigs: Map<string, Gig>;

  constructor() {
    this.rehearsals = new Map();
    this.tasks = new Map();
    this.gigs = new Map();
  }

  // Rehearsals
  async getRehearsals(): Promise<RehearsalWithTasks[]> {
    const rehearsals = Array.from(this.rehearsals.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return Promise.all(
      rehearsals.map(async (rehearsal) => ({
        ...rehearsal,
        tasks: await this.getTasks(rehearsal.id),
      }))
    );
  }

  async getRehearsal(id: string): Promise<RehearsalWithTasks | undefined> {
    const rehearsal = this.rehearsals.get(id);
    if (!rehearsal) return undefined;

    const tasks = await this.getTasks(id);
    return { ...rehearsal, tasks };
  }

  async createRehearsal(insertRehearsal: InsertRehearsal): Promise<Rehearsal> {
    const id = randomUUID();
    const rehearsal: Rehearsal = {
      ...insertRehearsal,
      id,
      createdAt: new Date(),
    };
    this.rehearsals.set(id, rehearsal);
    return rehearsal;
  }

  async updateRehearsal(id: string, updateData: Partial<InsertRehearsal>): Promise<Rehearsal | undefined> {
    const rehearsal = this.rehearsals.get(id);
    if (!rehearsal) return undefined;

    const updated: Rehearsal = { ...rehearsal, ...updateData };
    this.rehearsals.set(id, updated);
    return updated;
  }

  async deleteRehearsal(id: string): Promise<boolean> {
    // Also delete associated tasks
    const tasks = Array.from(this.tasks.values()).filter(task => task.rehearsalId === id);
    tasks.forEach(task => this.tasks.delete(task.id));
    
    return this.rehearsals.delete(id);
  }

  // Tasks
  async getTasks(rehearsalId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.rehearsalId === rehearsalId)
      .sort((a, b) => a.order - b.order);
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: new Date(),
      order: insertTask.order ?? 0,
      note: insertTask.note ?? null,
      status: insertTask.status ?? "open",
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updated: Task = { ...task, ...updateData };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async reorderTasks(rehearsalId: string, taskIds: string[]): Promise<Task[]> {
    const tasks = await this.getTasks(rehearsalId);
    const taskMap = new Map(tasks.map(task => [task.id, task]));

    taskIds.forEach((taskId, index) => {
      const task = taskMap.get(taskId);
      if (task) {
        task.order = index;
        this.tasks.set(taskId, task);
      }
    });

    return this.getTasks(rehearsalId);
  }

  // Gigs
  async getGigs(): Promise<Gig[]> {
    return Array.from(this.gigs.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getGig(id: string): Promise<Gig | undefined> {
    return this.gigs.get(id);
  }

  async createGig(insertGig: InsertGig): Promise<Gig> {
    const id = randomUUID();
    const gig: Gig = {
      ...insertGig,
      id,
      createdAt: new Date(),
      callTime: insertGig.callTime ?? null,
      venueAddress: insertGig.venueAddress ?? null,
      venueContact: insertGig.venueContact ?? null,
      compensation: insertGig.compensation ?? null,
      notes: insertGig.notes ?? null,
    };
    this.gigs.set(id, gig);
    return gig;
  }

  async updateGig(id: string, updateData: Partial<InsertGig>): Promise<Gig | undefined> {
    const gig = this.gigs.get(id);
    if (!gig) return undefined;

    const updated: Gig = { ...gig, ...updateData };
    this.gigs.set(id, updated);
    return updated;
  }

  async deleteGig(id: string): Promise<boolean> {
    return this.gigs.delete(id);
  }
}

export const storage = new MemStorage();
