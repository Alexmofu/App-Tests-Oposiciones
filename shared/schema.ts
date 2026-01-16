import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Stores questions imported from JSONs
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull(), // Identifier (e.g. filename)
  questionText: text("question_text").notNull(),
  answers: jsonb("answers").notNull(), // Stores { A: "...", B: "..." }
  correctAnswer: text("correct_answer").notNull(), // "A", "B", etc.
  category: text("category"), // The "oposicion" field
});

// Stores historical results
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull(),
  score: integer("score").notNull(), // 0-100 percentage
  correctCount: integer("correct_count").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// === SCHEMAS ===

export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertResultSchema = createInsertSchema(results).omit({ id: true, completedAt: true });

// === TYPES ===

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

// Helper for the frontend to know what answers look like
export type AnswerMap = Record<string, string>;
