import * as esbuild from "esbuild";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function buildElectron() {
  console.log("🔨 Building OposTest Pro for Electron...\n");

  // Limpiar carpeta de salida
  if (fs.existsSync("electron-app")) {
    fs.rmSync("electron-app", { recursive: true });
  }
  fs.mkdirSync("electron-app", { recursive: true });

  console.log("1. Building frontend with Vite...");
  execSync("npx vite build --outDir electron-app/renderer", { stdio: "inherit" });

  console.log("\n2. Building Electron main process...");
  await esbuild.build({
    entryPoints: ["electron/main.ts"],
    outfile: "electron-app/main.cjs",
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    external: [
      "electron",
      "better-sqlite3",
    ],
    alias: {
      "@shared": "./shared",
    },
  });

  console.log("\n3. Building Electron preload script...");
  await esbuild.build({
    entryPoints: ["electron/preload.ts"],
    outfile: "electron-app/preload.cjs",
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    external: ["electron"],
  });

  console.log("\n4. Creating package.json for Electron app...");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  const electronPkg = {
    name: "opostest-pro",
    version: pkg.version || "1.0.0",
    main: "main.cjs",
    author: pkg.author || "OposTest Team",
    description: "Plataforma de práctica para oposiciones españolas",
  };
  fs.writeFileSync("electron-app/package.json", JSON.stringify(electronPkg, null, 2));

  console.log("\n✅ Electron build complete!");
  console.log("\nArchivos generados en electron-app/:");
  console.log("  - main.cjs (proceso principal)");
  console.log("  - preload.cjs (script de preload)");
  console.log("  - renderer/ (frontend)");
  console.log("  - package.json");
  console.log("\nPara empaquetar para Windows, ejecuta:");
  console.log("  npx electron-builder --win --config electron-builder.json");
}

buildElectron().catch(console.error);
