import * as esbuild from "esbuild";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function buildElectron() {
  console.log("🔨 Building OposTest Pro for Electron...\n");

  console.log("1. Building frontend with Vite...");
  execSync("npx vite build --outDir dist-electron", { stdio: "inherit" });

  console.log("\n2. Building Electron main process...");
  await esbuild.build({
    entryPoints: ["electron/main.ts"],
    outfile: "electron-dist/main.cjs",
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
    outfile: "electron-dist/preload.cjs",
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    external: ["electron"],
  });

  console.log("\n4. Creating package.json for Electron...");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  const electronPkg = {
    name: pkg.name,
    version: pkg.version,
    main: "electron-dist/main.cjs",
    author: pkg.author || "OposTest Team",
    description: "Plataforma de práctica para oposiciones españolas",
    dependencies: {
      "better-sqlite3": pkg.dependencies["better-sqlite3"],
      "bcryptjs": pkg.dependencies["bcryptjs"],
      "electron-is-dev": pkg.dependencies["electron-is-dev"],
    },
  };
  fs.writeFileSync("electron-pkg.json", JSON.stringify(electronPkg, null, 2));

  console.log("\n✅ Electron build complete!");
  console.log("\nTo package for Windows, run:");
  console.log("  npx electron-builder --win --config electron-builder.json");
}

buildElectron().catch(console.error);
