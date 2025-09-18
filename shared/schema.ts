import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rehearsals = pgTable("rehearsals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  eventName: text("event_name").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  rehearsalId: varchar("rehearsal_id").notNull(),
  title: text("title").notNull(),
  note: text("note"),
  status: text("status").notNull().default("open"), // "open" | "closed"
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gigs = pgTable("gigs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  callTime: timestamp("call_time"),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address"),
  venueContact: text("venue_contact"),
  compensation: decimal("compensation", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRehearsalSchema = createInsertSchema(rehearsals).omit({
  id: true,
  createdAt: true,
  userId: true, // Server sets userId from auth
}).extend({
  date: z.string().transform(val => new Date(val)),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  userId: true, // Server sets userId from auth
});

export const insertGigSchema = createInsertSchema(gigs).omit({
  id: true,
  createdAt: true,
  userId: true, // Server sets userId from auth
}).extend({
  date: z.string().transform(val => new Date(val)),
  callTime: z.string().optional().transform(val => val ? new Date(val) : null),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type InsertRehearsal = z.infer<typeof insertRehearsalSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertGig = z.infer<typeof insertGigSchema>;

export type Rehearsal = typeof rehearsals.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Gig = typeof gigs.$inferSelect;

// Client-side types for comprehensive data
export type RehearsalWithTasks = Rehearsal & {
  tasks: Task[];
};
