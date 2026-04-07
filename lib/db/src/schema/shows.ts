import { pgTable, serial, text, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const showTypeEnum = pgEnum("show_type", ["movie", "anime", "tv"]);
export const showStatusEnum = pgEnum("show_status", ["ongoing", "completed", "upcoming"]);

export const showsTable = pgTable("shows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: showTypeEnum("type").notNull(),
  description: text("description").notNull(),
  genres: text("genres").array().notNull().default([]),
  year: integer("year").notNull(),
  rating: real("rating").notNull().default(0),
  posterUrl: text("poster_url").notNull(),
  backdropUrl: text("backdrop_url").notNull(),
  episodes: integer("episodes"),
  duration: integer("duration"),
  status: showStatusEnum("status").notNull().default("completed"),
  trending: boolean("trending").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShowSchema = createInsertSchema(showsTable).omit({ id: true, createdAt: true });
export const updateShowSchema = insertShowSchema.partial();

export type InsertShow = z.infer<typeof insertShowSchema>;
export type Show = typeof showsTable.$inferSelect;
