import { db } from "./db";
import {
  questions,
  results,
  type InsertQuestion,
  type Question,
  type InsertResult,
  type Result
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
}

export class DatabaseStorage implements IStorage {
  async getTests(): Promise<{ id: string; count: number; category: string | null }[]> {
    // Group by testId and count
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
    // Drizzle insert many
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
}

export const storage = new DatabaseStorage();
