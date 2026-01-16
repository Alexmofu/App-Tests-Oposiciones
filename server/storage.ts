import { db } from "./db";
import {
  questions,
  results,
  testAttempts,
  type InsertQuestion,
  type Question,
  type InsertResult,
  type Result,
  type TestAttempt
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Test/Questions
  getTests(): Promise<{ id: string; count: number; category: string | null }[]>;
  getQuestionsByTestId(testId: string): Promise<Question[]>;
  createQuestions(questionsList: InsertQuestion[]): Promise<void>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<void>;
  
  // Results
  getResults(): Promise<Result[]>;
  createResult(result: InsertResult): Promise<Result>;

  // Attempts
  getAttempts(): Promise<TestAttempt[]>;
  getAttempt(id: number): Promise<TestAttempt | undefined>;
  createAttempt(attempt: { testId: string; questionOrder: number[]; totalQuestions: number }): Promise<TestAttempt>;
  updateAttempt(id: number, update: Partial<TestAttempt>): Promise<TestAttempt | undefined>;
  deleteAttempt(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTests(): Promise<{ id: string; count: number; category: string | null }[]> {
    const rows = await db
      .select({
        id: questions.testId,
        count: sql<number>`count(*)`.mapWith(Number),
        category: sql<string>`MAX(${questions.category})`
      })
      .from(questions)
      .groupBy(questions.testId);
      
    return rows;
  }

  async getQuestionsByTestId(testId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.testId, testId));
  }

  async createQuestions(questionsList: InsertQuestion[]): Promise<void> {
    if (questionsList.length === 0) return;
    await db.insert(questions).values(questionsList);
  }

  async updateQuestion(id: number, update: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updated] = await db
      .update(questions)
      .set(update)
      .where(eq(questions.id, id))
      .returning();
    return updated;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async getResults(): Promise<Result[]> {
    return await db.select().from(results).orderBy(desc(results.completedAt));
  }

  async createResult(result: InsertResult): Promise<Result> {
    const [saved] = await db.insert(results).values(result).returning();
    return saved;
  }

  // Attempts
  async getAttempts(): Promise<TestAttempt[]> {
    return await db.select().from(testAttempts).orderBy(desc(testAttempts.startedAt));
  }

  async getAttempt(id: number): Promise<TestAttempt | undefined> {
    const [attempt] = await db.select().from(testAttempts).where(eq(testAttempts.id, id));
    return attempt;
  }

  async createAttempt(attempt: { testId: string; questionOrder: number[]; totalQuestions: number }): Promise<TestAttempt> {
    const [created] = await db.insert(testAttempts).values({
      testId: attempt.testId,
      questionOrder: attempt.questionOrder,
      totalQuestions: attempt.totalQuestions,
      status: "in_progress",
      currentIndex: 0,
      answers: {},
    }).returning();
    return created;
  }

  async updateAttempt(id: number, update: Partial<TestAttempt>): Promise<TestAttempt | undefined> {
    const updateData: any = { ...update };
    if (update.status === "completed") {
      updateData.completedAt = new Date();
    }
    const [updated] = await db
      .update(testAttempts)
      .set(updateData)
      .where(eq(testAttempts.id, id))
      .returning();
    return updated;
  }

  async deleteAttempt(id: number): Promise<void> {
    await db.delete(testAttempts).where(eq(testAttempts.id, id));
  }
}

export const storage = new DatabaseStorage();
