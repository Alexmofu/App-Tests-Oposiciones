import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: text("test_id").notNull(),
  questionText: text("question_text").notNull(),
  answers: text("answers", { mode: "json" }).notNull().$type<Record<string, string>>(),
  correctAnswer: text("correct_answer").notNull(),
  category: text("category"),
  userId: integer("user_id"),
});

export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: text("test_id").notNull(),
  score: integer("score").notNull(),
  correctCount: integer("correct_count").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  userId: integer("user_id"),
});

export const testAttempts = sqliteTable("test_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: text("test_id").notNull(),
  status: text("status").notNull().default("in_progress"),
  currentIndex: integer("current_index").notNull().default(0),
  answers: text("answers", { mode: "json" }).notNull().$type<Record<string, string>>(),
  questionOrder: text("question_order", { mode: "json" }).notNull().$type<number[]>(),
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").default(0),
  score: integer("score").default(0),
  startedAt: integer("started_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  userId: integer("user_id"),
});

export const sessions = sqliteTable("session", {
  sid: text("sid").primaryKey(),
  sess: text("sess", { mode: "json" }).notNull(),
  expire: integer("expire", { mode: "timestamp" }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertResultSchema = createInsertSchema(results).omit({ id: true, completedAt: true });
export const insertAttemptSchema = createInsertSchema(testAttempts).omit({ id: true, startedAt: true, completedAt: true });

export const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type AnswerMap = Record<string, string>;
