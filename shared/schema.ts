import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Stores questions imported from JSONs
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull(),
  questionText: text("question_text").notNull(),
  answers: jsonb("answers").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  category: text("category"),
});

// Stores historical results (completed tests)
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull(),
  score: integer("score").notNull(),
  correctCount: integer("correct_count").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Stores test attempts (in-progress or completed)
export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testId: text("test_id").notNull(),
  status: text("status").notNull().default("in_progress"), // "in_progress" | "completed"
  currentIndex: integer("current_index").notNull().default(0),
  answers: jsonb("answers").notNull().default({}), // { questionId: selectedAnswer }
  questionOrder: jsonb("question_order").notNull(), // Array of question IDs in order (for randomization)
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").default(0),
  score: integer("score").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// === SCHEMAS ===

export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertResultSchema = createInsertSchema(results).omit({ id: true, completedAt: true });
export const insertAttemptSchema = createInsertSchema(testAttempts).omit({ id: true, startedAt: true, completedAt: true });

// === TYPES ===

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

// Helper for the frontend to know what answers look like
export type AnswerMap = Record<string, string>;
