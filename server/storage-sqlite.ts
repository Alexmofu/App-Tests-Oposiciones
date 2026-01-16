import { getSqliteDb } from "./db-sqlite";
import {
  questions,
  results,
  testAttempts,
  users,
  type InsertQuestion,
  type Question,
  type InsertResult,
  type Result,
  type TestAttempt,
  type User,
  type InsertUser
} from "@shared/schema-sqlite";
import { eq, desc, sql, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export class SqliteStorage implements IStorage {
  private get db() {
    return getSqliteDb();
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = this.db.insert(users).values(user).returning().get();
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = this.db.select().from(users).where(eq(users.username, username)).get();
    return result;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = this.db.select().from(users).where(eq(users.id, id)).get();
    return result;
  }

  async getTests(userId?: number): Promise<{ id: string; count: number; category: string | null }[]> {
    if (userId) {
      const rows = this.db
        .select({
          id: questions.testId,
          count: sql<number>`count(*)`,
          category: sql<string | null>`MAX(${questions.category})`
        })
        .from(questions)
        .where(eq(questions.userId, userId))
        .groupBy(questions.testId)
        .all();
      return rows.map(r => ({ id: r.id, count: Number(r.count), category: r.category }));
    }
    
    const rows = this.db
      .select({
        id: questions.testId,
        count: sql<number>`count(*)`,
        category: sql<string | null>`MAX(${questions.category})`
      })
      .from(questions)
      .groupBy(questions.testId)
      .all();
    return rows.map(r => ({ id: r.id, count: Number(r.count), category: r.category }));
  }

  async getQuestionsByTestId(testId: string, userId?: number): Promise<Question[]> {
    if (userId) {
      return this.db.select().from(questions).where(
        and(eq(questions.testId, testId), eq(questions.userId, userId))
      ).all();
    }
    return this.db.select().from(questions).where(eq(questions.testId, testId)).all();
  }

  async createQuestions(questionsList: InsertQuestion[]): Promise<void> {
    if (questionsList.length === 0) return;
    this.db.insert(questions).values(questionsList).run();
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const result = this.db.insert(questions).values(question).returning().get();
    return result;
  }

  async updateQuestion(id: number, update: Partial<InsertQuestion>): Promise<Question | undefined> {
    const result = this.db
      .update(questions)
      .set(update)
      .where(eq(questions.id, id))
      .returning()
      .get();
    return result;
  }

  async deleteQuestion(id: number): Promise<void> {
    this.db.delete(questions).where(eq(questions.id, id)).run();
  }

  async deleteTest(testId: string, userId?: number): Promise<void> {
    if (userId) {
      this.db.delete(questions).where(
        and(eq(questions.testId, testId), eq(questions.userId, userId))
      ).run();
    } else {
      this.db.delete(questions).where(eq(questions.testId, testId)).run();
    }
  }

  async renameTest(oldTestId: string, newTestId: string, userId?: number): Promise<void> {
    if (userId) {
      this.db.update(questions)
        .set({ testId: newTestId })
        .where(and(eq(questions.testId, oldTestId), eq(questions.userId, userId)))
        .run();
    } else {
      this.db.update(questions)
        .set({ testId: newTestId })
        .where(eq(questions.testId, oldTestId))
        .run();
    }
  }

  async getResults(userId?: number): Promise<Result[]> {
    if (userId) {
      return this.db.select().from(results)
        .where(eq(results.userId, userId))
        .orderBy(desc(results.completedAt))
        .all();
    }
    return this.db.select().from(results).orderBy(desc(results.completedAt)).all();
  }

  async createResult(result: InsertResult): Promise<Result> {
    const saved = this.db.insert(results).values(result).returning().get();
    return saved;
  }

  async deleteResult(id: number): Promise<void> {
    this.db.delete(results).where(eq(results.id, id)).run();
  }

  async getAttempts(userId?: number): Promise<TestAttempt[]> {
    if (userId) {
      return this.db.select().from(testAttempts)
        .where(eq(testAttempts.userId, userId))
        .orderBy(desc(testAttempts.startedAt))
        .all();
    }
    return this.db.select().from(testAttempts).orderBy(desc(testAttempts.startedAt)).all();
  }

  async getAttempt(id: number): Promise<TestAttempt | undefined> {
    const attempt = this.db.select().from(testAttempts).where(eq(testAttempts.id, id)).get();
    return attempt;
  }

  async createAttempt(attempt: { testId: string; questionOrder: number[]; totalQuestions: number; userId?: number }): Promise<TestAttempt> {
    const created = this.db.insert(testAttempts).values({
      testId: attempt.testId,
      questionOrder: attempt.questionOrder,
      totalQuestions: attempt.totalQuestions,
      status: "in_progress",
      currentIndex: 0,
      answers: {} as Record<string, string>,
      userId: attempt.userId,
    }).returning().get();
    return created;
  }

  async updateAttempt(id: number, update: Partial<TestAttempt>): Promise<TestAttempt | undefined> {
    const updateData: any = { ...update };
    if (update.status === "completed") {
      updateData.completedAt = new Date();
    }
    const updated = this.db
      .update(testAttempts)
      .set(updateData)
      .where(eq(testAttempts.id, id))
      .returning()
      .get();
    return updated;
  }

  async deleteAttempt(id: number): Promise<void> {
    this.db.delete(testAttempts).where(eq(testAttempts.id, id)).run();
  }
}
