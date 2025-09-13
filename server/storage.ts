import { type Rehearsal, type Task, type Gig, type InsertRehearsal, type InsertTask, type InsertGig, type RehearsalWithTasks, type User, type UpsertUser, rehearsals, tasks, gigs, users } from "@shared/schema";
import { db } from "./db";
import { eq, and, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Rehearsals (user-scoped)
  getRehearsals(userId: string): Promise<RehearsalWithTasks[]>;
  getRehearsal(id: string, userId: string): Promise<RehearsalWithTasks | undefined>;
  createRehearsal(rehearsal: InsertRehearsal, userId: string): Promise<Rehearsal>;
  updateRehearsal(id: string, rehearsal: Partial<InsertRehearsal>, userId: string): Promise<Rehearsal | undefined>;
  deleteRehearsal(id: string, userId: string): Promise<boolean>;

  // Tasks (user-scoped)
  getTasks(rehearsalId: string, userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask, userId: string): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>, userId: string): Promise<Task | undefined>;
  deleteTask(id: string, userId: string): Promise<boolean>;
  reorderTasks(rehearsalId: string, taskIds: string[], userId: string): Promise<Task[]>;

  // Gigs (user-scoped)
  getGigs(userId: string): Promise<Gig[]>;
  getGig(id: string, userId: string): Promise<Gig | undefined>;
  createGig(gig: InsertGig, userId: string): Promise<Gig>;
  updateGig(id: string, gig: Partial<InsertGig>, userId: string): Promise<Gig | undefined>;
  deleteGig(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Rehearsals (user-scoped)
  async getRehearsals(userId: string): Promise<RehearsalWithTasks[]> {
    const rehearsalList = await db.select().from(rehearsals)
      .where(eq(rehearsals.userId, userId))
      .orderBy(asc(rehearsals.date));
    
    const rehearsalsWithTasks = await Promise.all(
      rehearsalList.map(async (rehearsal) => ({
        ...rehearsal,
        tasks: await this.getTasks(rehearsal.id, userId),
      }))
    );
    
    return rehearsalsWithTasks;
  }

  async getRehearsal(id: string, userId: string): Promise<RehearsalWithTasks | undefined> {
    const [rehearsal] = await db.select().from(rehearsals)
      .where(and(eq(rehearsals.id, id), eq(rehearsals.userId, userId)));
    if (!rehearsal) return undefined;

    const rehearsalTasks = await this.getTasks(id, userId);
    return { ...rehearsal, tasks: rehearsalTasks };
  }

  async createRehearsal(insertRehearsal: InsertRehearsal, userId: string): Promise<Rehearsal> {
    const [rehearsal] = await db
      .insert(rehearsals)
      .values({ ...insertRehearsal, userId })
      .returning();
    return rehearsal;
  }

  async updateRehearsal(id: string, updateData: Partial<InsertRehearsal>, userId: string): Promise<Rehearsal | undefined> {
    const [updated] = await db
      .update(rehearsals)
      .set(updateData)
      .where(and(eq(rehearsals.id, id), eq(rehearsals.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteRehearsal(id: string, userId: string): Promise<boolean> {
    // Delete associated tasks first (user-scoped)
    await db.delete(tasks).where(and(eq(tasks.rehearsalId, id), eq(tasks.userId, userId)));
    
    const result = await db.delete(rehearsals)
      .where(and(eq(rehearsals.id, id), eq(rehearsals.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Tasks (user-scoped)
  async getTasks(rehearsalId: string, userId: string): Promise<Task[]> {
    const taskList = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.rehearsalId, rehearsalId), eq(tasks.userId, userId)))
      .orderBy(asc(tasks.order));
    return taskList;
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask, userId: string): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values({ ...insertTask, userId })
      .returning();
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>, userId: string): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTasks(rehearsalId: string, taskIds: string[], userId: string): Promise<Task[]> {
    // Update each task's order based on position in taskIds array
    await Promise.all(
      taskIds.map((taskId, index) =>
        db.update(tasks)
          .set({ order: index })
          .where(and(eq(tasks.id, taskId), eq(tasks.rehearsalId, rehearsalId), eq(tasks.userId, userId)))
      )
    );

    return this.getTasks(rehearsalId, userId);
  }

  // Gigs (user-scoped)
  async getGigs(userId: string): Promise<Gig[]> {
    const gigList = await db.select().from(gigs)
      .where(eq(gigs.userId, userId))
      .orderBy(asc(gigs.date));
    return gigList;
  }

  async getGig(id: string, userId: string): Promise<Gig | undefined> {
    const [gig] = await db.select().from(gigs)
      .where(and(eq(gigs.id, id), eq(gigs.userId, userId)));
    return gig || undefined;
  }

  async createGig(insertGig: InsertGig, userId: string): Promise<Gig> {
    const [gig] = await db
      .insert(gigs)
      .values({ ...insertGig, userId })
      .returning();
    return gig;
  }

  async updateGig(id: string, updateData: Partial<InsertGig>, userId: string): Promise<Gig | undefined> {
    const [updated] = await db
      .update(gigs)
      .set(updateData)
      .where(and(eq(gigs.id, id), eq(gigs.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteGig(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(gigs)
      .where(and(eq(gigs.id, id), eq(gigs.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
