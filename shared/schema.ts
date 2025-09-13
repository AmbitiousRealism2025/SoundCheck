import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rehearsals = pgTable("rehearsals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventName: text("event_name").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rehearsalId: varchar("rehearsal_id").notNull(),
  title: text("title").notNull(),
  note: text("note"),
  status: text("status").notNull().default("open"), // "open" | "closed"
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gigs = pgTable("gigs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
}).extend({
  date: z.string().transform(val => new Date(val)),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertGigSchema = createInsertSchema(gigs).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().transform(val => new Date(val)),
  callTime: z.string().optional().transform(val => val ? new Date(val) : null),
});

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
