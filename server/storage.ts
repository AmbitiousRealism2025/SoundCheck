import { type Rehearsal, type Task, type Gig, type InsertRehearsal, type InsertTask, type InsertGig, type RehearsalWithTasks, rehearsals, tasks, gigs } from "@shared/schema";
import { db } from "./db";
import { eq, and, asc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // Rehearsals
  async getRehearsals(): Promise<RehearsalWithTasks[]> {
    const rehearsalList = await db.select().from(rehearsals).orderBy(asc(rehearsals.date));
    
    const rehearsalsWithTasks = await Promise.all(
      rehearsalList.map(async (rehearsal) => ({
        ...rehearsal,
        tasks: await this.getTasks(rehearsal.id),
      }))
    );
    
    return rehearsalsWithTasks;
  }

  async getRehearsal(id: string): Promise<RehearsalWithTasks | undefined> {
    const [rehearsal] = await db.select().from(rehearsals).where(eq(rehearsals.id, id));
    if (!rehearsal) return undefined;

    const rehearsalTasks = await this.getTasks(id);
    return { ...rehearsal, tasks: rehearsalTasks };
  }

  async createRehearsal(insertRehearsal: InsertRehearsal): Promise<Rehearsal> {
    const [rehearsal] = await db
      .insert(rehearsals)
      .values(insertRehearsal)
      .returning();
    return rehearsal;
  }

  async updateRehearsal(id: string, updateData: Partial<InsertRehearsal>): Promise<Rehearsal | undefined> {
    const [updated] = await db
      .update(rehearsals)
      .set(updateData)
      .where(eq(rehearsals.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRehearsal(id: string): Promise<boolean> {
    // Delete associated tasks first
    await db.delete(tasks).where(eq(tasks.rehearsalId, id));
    
    const result = await db.delete(rehearsals).where(eq(rehearsals.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tasks
  async getTasks(rehearsalId: string): Promise<Task[]> {
    const taskList = await db
      .select()
      .from(tasks)
      .where(eq(tasks.rehearsalId, rehearsalId))
      .orderBy(asc(tasks.order));
    return taskList;
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTasks(rehearsalId: string, taskIds: string[]): Promise<Task[]> {
    // Update each task's order based on position in taskIds array
    await Promise.all(
      taskIds.map((taskId, index) =>
        db.update(tasks)
          .set({ order: index })
          .where(and(eq(tasks.id, taskId), eq(tasks.rehearsalId, rehearsalId)))
      )
    );

    return this.getTasks(rehearsalId);
  }

  // Gigs
  async getGigs(): Promise<Gig[]> {
    const gigList = await db.select().from(gigs).orderBy(asc(gigs.date));
    return gigList;
  }

  async getGig(id: string): Promise<Gig | undefined> {
    const [gig] = await db.select().from(gigs).where(eq(gigs.id, id));
    return gig || undefined;
  }

  async createGig(insertGig: InsertGig): Promise<Gig> {
    const [gig] = await db
      .insert(gigs)
      .values(insertGig)
      .returning();
    return gig;
  }

  async updateGig(id: string, updateData: Partial<InsertGig>): Promise<Gig | undefined> {
    const [updated] = await db
      .update(gigs)
      .set(updateData)
      .where(eq(gigs.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteGig(id: string): Promise<boolean> {
    const result = await db.delete(gigs).where(eq(gigs.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
