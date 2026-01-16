import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { InsertQuestion } from "@shared/schema";
import fetch from "node-fetch";

import fs from "fs";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Seed Data ===
  (async () => {
    try {
      const existingTests = await storage.getTests();
      if (existingTests.length === 0) {
        console.log("Seeding database with initial data...");
        const seedFilePath = path.join(process.cwd(), "attached_assets", "preguntas2_1768557841138.json");
        
        if (fs.existsSync(seedFilePath)) {
          const content = fs.readFileSync(seedFilePath, "utf-8");
          const json = JSON.parse(content);
          
          const questionsToInsert: InsertQuestion[] = json.map((q: any) => ({
            testId: "preguntas2_1768557841138.json",
            questionText: q.pregunta,
            answers: q.respuestas,
            correctAnswer: q.respuesta_correcta,
            category: q.oposicion || "General",
          }));
          
          await storage.createQuestions(questionsToInsert);
          console.log(`Seeded ${questionsToInsert.length} questions.`);
        } else {
            console.log("Seed file not found:", seedFilePath);
        }
      }
    } catch (err) {
      console.error("Error seeding database:", err);
    }
  })();

  // === Tests ===
  app.get(api.tests.list.path, async (req, res) => {
    const tests = await storage.getTests();
    res.json(tests);
  });

  app.get(api.tests.get.path, async (req, res) => {
    const testId = req.params.id;
    const questions = await storage.getQuestionsByTestId(testId);
    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: "Test not found" });
    }
    res.json(questions);
  });

  app.post(api.tests.import.path, async (req, res) => {
    try {
      const input = api.tests.import.input.parse(req.body);
      
      // Transform raw JSON to DB schema
      const questionsToInsert: InsertQuestion[] = input.content.map((q: any) => ({
        testId: input.filename,
        questionText: q.pregunta,
        answers: q.respuestas,
        correctAnswer: q.respuesta_correcta,
        category: q.oposicion || "General",
      }));

      if (questionsToInsert.length === 0) {
        return res.status(400).json({ message: "No valid questions found in JSON" });
      }

      await storage.createQuestions(questionsToInsert);
      
      res.status(201).json({ success: true, count: questionsToInsert.length });
    } catch (err) {
      console.error("Import error:", err);
      res.status(400).json({ message: "Invalid data format" });
    }
  });

  // === Questions ===
  app.put(api.questions.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const update = api.questions.update.input.parse(req.body);
      const updated = await storage.updateQuestion(id, update);
      if (!updated) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.delete(api.questions.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteQuestion(id);
    res.status(204).send();
  });

  // === Results ===
  app.get(api.results.list.path, async (req, res) => {
    const results = await storage.getResults();
    res.json(results);
  });

  app.post(api.results.create.path, async (req, res) => {
    try {
      const input = api.results.create.input.parse(req.body);
      const result = await storage.createResult(input);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: "Validation error" });
    }
  });

  // === Attempts ===
  app.get(api.attempts.list.path, async (req, res) => {
    const attempts = await storage.getAttempts();
    res.json(attempts);
  });

  app.get(api.attempts.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const attempt = await storage.getAttempt(id);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    res.json(attempt);
  });

  app.post(api.attempts.create.path, async (req, res) => {
    try {
      const input = api.attempts.create.input.parse(req.body);
      const attempt = await storage.createAttempt(input);
      res.status(201).json(attempt);
    } catch (err) {
      console.error("Create attempt error:", err);
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.put(api.attempts.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const update = api.attempts.update.input.parse(req.body);
      const updated = await storage.updateAttempt(id, update);
      if (!updated) {
        return res.status(404).json({ message: "Attempt not found" });
      }
      res.json(updated);
    } catch (err) {
      console.error("Update attempt error:", err);
      res.status(400).json({ message: "Validation error" });
    }
  });

  app.delete(api.attempts.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteAttempt(id);
    res.status(204).send();
  });

  // === Remote ===
  app.get(api.remote.list.path, async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ message: "URL required" });

    try {
      // Logic: Ensure URL ends with slash or handle it
      // This expects the remote server to return a list of files or an HTML directory listing we can parse?
      // The prompt says "directory public". Usually a simple file server returns HTML links.
      // For simplicity, let's assume the user points to a JSON index or we try to fetch a specific manifest.
      // OR, if it's a simple HTTP server (python -m http.server), we can parse hrefs.
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch remote URL");
      
      const text = await response.text();
      // Simple regex to find .json links
      const jsonFiles = [...text.matchAll(/href="([^"]+\.json)"/g)].map(m => m[1]);
      // Also try single quotes
      const jsonFiles2 = [...text.matchAll(/href='([^']+\.json)'/g)].map(m => m[1]);
      
      const allFiles = [...new Set([...jsonFiles, ...jsonFiles2])];
      
      res.json(allFiles);
    } catch (err) {
      console.error("Remote list error:", err);
      res.status(400).json({ message: "Failed to list remote files. Ensure the URL is accessible and is a directory listing." });
    }
  });

  app.get(api.remote.fetch.path, async (req, res) => {
    const url = req.query.url as string;
    const filename = req.query.filename as string;
    
    if (!url || !filename) return res.status(400).json({ message: "URL and filename required" });

    try {
      // Construct full URL
      const fullUrl = url.endsWith('/') ? `${url}${filename}` : `${url}/${filename}`;
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Failed to download file");
      
      const json = await response.json();
      res.json(json);
    } catch (err) {
      console.error("Remote fetch error:", err);
      res.status(400).json({ message: "Failed to fetch remote file content" });
    }
  });

  return httpServer;
}
