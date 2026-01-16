import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import isDev from "electron-is-dev";
import { setDbPath, initializeSqliteDatabase, closeSqliteDatabase } from "../server/db-sqlite";
import { SqliteStorage } from "../server/storage-sqlite";
import bcrypt from "bcryptjs";

let mainWindow: BrowserWindow | null = null;
let storage: SqliteStorage | null = null;
let currentUserId: number = 1; // Usuario por defecto siempre activo

async function ensureDefaultUser() {
  if (!storage) return;
  
  try {
    const user = await storage.getUserById(1);
    if (!user) {
      // Crear usuario por defecto con contraseña aleatoria (no se usa)
      const randomPass = Math.random().toString(36).slice(2);
      await storage.createUser({ username: "usuario", password: randomPass });
      console.log("Usuario por defecto creado");
    }
  } catch (error) {
    console.log("Creando usuario por defecto...");
    const randomPass = Math.random().toString(36).slice(2);
    await storage.createUser({ username: "usuario", password: randomPass });
  }
}

function createWindow() {
  const appPath = app.getAppPath();
  
  // En producción: resources/app/ contiene main.cjs, preload.cjs, renderer/
  // En desarrollo: electron/main.ts está en electron/, el frontend en localhost
  const preloadPath = isDev 
    ? path.join(__dirname, "preload.cjs")
    : path.join(appPath, "preload.cjs");
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    icon: isDev 
      ? path.join(__dirname, "../client/public/icon-192.png")
      : path.join(appPath, "renderer/icon-192.png"),
    title: "OposTest Pro",
  });
  
  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    mainWindow.loadURL("http://localhost:5000");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(appPath, "renderer", "index.html");
    console.log("Loading:", indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const dbPath = path.join(app.getPath("userData"), "opostest.db");
  setDbPath(dbPath);
  initializeSqliteDatabase();
  storage = new SqliteStorage();
  
  // Crear usuario por defecto automáticamente
  await ensureDefaultUser();
  
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  closeSqliteDatabase();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("auth:register", async (_event, { username, password }) => {
  try {
    if (!storage) throw new Error("Storage not initialized");
    
    const existing = await storage.getUserByUsername(username);
    if (existing) {
      return { success: false, error: "El usuario ya existe" };
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await storage.createUser({ username, password: hashedPassword });
    currentUserId = user.id;
    
    return { success: true, user: { id: user.id, username: user.username } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth:login", async (_event, { username, password }) => {
  try {
    if (!storage) throw new Error("Storage not initialized");
    
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return { success: false, error: "Usuario o contraseña incorrectos" };
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { success: false, error: "Usuario o contraseña incorrectos" };
    }
    
    currentUserId = user.id;
    return { success: true, user: { id: user.id, username: user.username } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth:logout", async () => {
  // No hace nada en Electron (usuario siempre activo)
  return { success: true };
});

ipcMain.handle("auth:me", async () => {
  // Siempre devolver usuario por defecto en Electron (sin login requerido)
  return { success: true, user: { id: 1, username: "usuario" } };
});

ipcMain.handle("tests:list", async () => {
  if (!storage) return [];
  return await storage.getTests(currentUserId);
});

ipcMain.handle("tests:questions", async (_event, testId: string) => {
  if (!storage) return [];
  return await storage.getQuestionsByTestId(testId, currentUserId);
});

ipcMain.handle("tests:delete", async (_event, testId: string) => {
  if (!storage) return { success: false };
  await storage.deleteTest(testId, currentUserId);
  return { success: true };
});

ipcMain.handle("tests:rename", async (_event, { oldTestId, newTestId }) => {
  if (!storage) return { success: false };
  await storage.renameTest(oldTestId, newTestId, currentUserId);
  return { success: true };
});

ipcMain.handle("tests:import", async (_event, { testId, questions: questionsList, category }) => {
  if (!storage) return { success: false };
  
  const questionsToInsert = questionsList.map((q: any) => ({
    testId,
    questionText: q.questionText || q.pregunta,
    answers: q.answers || q.respuestas,
    correctAnswer: q.correctAnswer || q.correcta,
    category: category || q.category || q.categoria || null,
    userId: currentUserId,
  }));
  
  await storage.createQuestions(questionsToInsert);
  return { success: true };
});

ipcMain.handle("questions:create", async (_event, question) => {
  if (!storage) return null;
  return await storage.createQuestion({ ...question, userId: currentUserId });
});

ipcMain.handle("questions:update", async (_event, { id, update }) => {
  if (!storage) return null;
  return await storage.updateQuestion(id, update);
});

ipcMain.handle("questions:delete", async (_event, id: number) => {
  if (!storage) return { success: false };
  await storage.deleteQuestion(id);
  return { success: true };
});

ipcMain.handle("results:list", async () => {
  if (!storage) return [];
  return await storage.getResults(currentUserId);
});

ipcMain.handle("results:create", async (_event, result) => {
  if (!storage) return null;
  return await storage.createResult({ ...result, userId: currentUserId });
});

ipcMain.handle("results:delete", async (_event, id: number) => {
  if (!storage) return { success: false };
  await storage.deleteResult(id);
  return { success: true };
});

ipcMain.handle("attempts:list", async () => {
  if (!storage) return [];
  return await storage.getAttempts(currentUserId);
});

ipcMain.handle("attempts:get", async (_event, id: number) => {
  if (!storage) return null;
  return await storage.getAttempt(id);
});

ipcMain.handle("attempts:create", async (_event, attempt) => {
  if (!storage) return null;
  return await storage.createAttempt({ ...attempt, userId: currentUserId });
});

ipcMain.handle("attempts:update", async (_event, { id, update }) => {
  if (!storage) return null;
  return await storage.updateAttempt(id, update);
});

ipcMain.handle("attempts:delete", async (_event, id: number) => {
  if (!storage) return { success: false };
  await storage.deleteAttempt(id);
  return { success: true };
});

ipcMain.handle("dialog:openFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openFile"],
    filters: [{ name: "JSON Files", extensions: ["json"] }],
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }
  
  try {
    const content = fs.readFileSync(result.filePaths[0], "utf-8");
    const data = JSON.parse(content);
    return { success: true, data, filename: path.basename(result.filePaths[0]) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("config:get", async () => {
  return {
    appName: "OposTest Pro",
    appDescription: "Plataforma de práctica para oposiciones",
    welcomeMessage: "Preparando tu sesión de estudio...",
    isElectron: true,
  };
});
