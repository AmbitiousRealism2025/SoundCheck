import { type Rehearsal, type Task, type Gig, type InsertRehearsal, type InsertTask, type InsertGig, type RehearsalWithTasks, type User, type UpsertUser, rehearsals, tasks, gigs, users } from "@shared/schema";
import { supabase } from "./lib/supabase";
import { eq, and, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Supabase Auth)
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

export class SupabaseStorage implements IStorage {
  // User operations (required for Supabase Auth)
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return data;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        ...userData,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Rehearsals (user-scoped)
  async getRehearsals(userId: string): Promise<RehearsalWithTasks[]> {
    const { data: rehearsals, error } = await supabase
      .from('rehearsals')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;

    const rehearsalsWithTasks = await Promise.all(
      rehearsals.map(async (rehearsal) => ({
        ...rehearsal,
        tasks: await this.getTasks(rehearsal.id, userId),
      }))
    );

    return rehearsalsWithTasks;
  }

  async getRehearsal(id: string, userId: string): Promise<RehearsalWithTasks | undefined> {
    const { data: rehearsal, error } = await supabase
      .from('rehearsals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !rehearsal) return undefined;

    const rehearsalTasks = await this.getTasks(id, userId);
    return { ...rehearsal, tasks: rehearsalTasks };
  }

  async createRehearsal(insertRehearsal: InsertRehearsal, userId: string): Promise<Rehearsal> {
    const { data, error } = await supabase
      .from('rehearsals')
      .insert({
        ...insertRehearsal,
        user_id: userId,
        date: new Date(insertRehearsal.date).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRehearsal(id: string, updateData: Partial<InsertRehearsal>, userId: string): Promise<Rehearsal | undefined> {
    const updatePayload: any = { ...updateData };
    if (updateData.date) {
      updatePayload.date = new Date(updateData.date).toISOString();
    }

    const { data, error } = await supabase
      .from('rehearsals')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRehearsal(id: string, userId: string): Promise<boolean> {
    // Delete associated tasks first (RLS ensures user can only delete their own)
    const { error: deleteTasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('rehearsal_id', id)
      .eq('user_id', userId);

    if (deleteTasksError) throw deleteTasksError;

    const { error } = await supabase
      .from('rehearsals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // Tasks (user-scoped)
  async getTasks(rehearsalId: string, userId: string): Promise<Task[]> {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('rehearsal_id', rehearsalId)
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error) throw error;
    return tasks || [];
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return undefined;
    return data;
  }

  async createTask(insertTask: InsertTask, userId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...insertTask,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>, userId: string): Promise<Task | undefined> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  async reorderTasks(rehearsalId: string, taskIds: string[], userId: string): Promise<Task[]> {
    // Update each task's order based on position in taskIds array
    const updatePromises = taskIds.map((taskId, index) =>
      supabase
        .from('tasks')
        .update({ order: index })
        .eq('id', taskId)
        .eq('rehearsal_id', rehearsalId)
        .eq('user_id', userId)
    );

    await Promise.all(updatePromises);

    return this.getTasks(rehearsalId, userId);
  }

  // Gigs (user-scoped)
  async getGigs(userId: string): Promise<Gig[]> {
    const { data: gigs, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    return gigs || [];
  }

  async getGig(id: string, userId: string): Promise<Gig | undefined> {
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return undefined;
    return data;
  }

  async createGig(insertGig: InsertGig, userId: string): Promise<Gig> {
    const { data, error } = await supabase
      .from('gigs')
      .insert({
        ...insertGig,
        user_id: userId,
        date: new Date(insertGig.date).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateGig(id: string, updateData: Partial<InsertGig>, userId: string): Promise<Gig | undefined> {
    const updatePayload: any = { ...updateData };
    if (updateData.date) {
      updatePayload.date = new Date(updateData.date).toISOString();
    }

    const { data, error } = await supabase
      .from('gigs')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGig(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }
}

export const storage = new SupabaseStorage();