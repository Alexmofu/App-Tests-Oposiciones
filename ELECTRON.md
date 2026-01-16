# OposTest Pro - Versión de Escritorio (Electron)

Esta guía explica cómo compilar OposTest Pro como una aplicación de escritorio para Windows 10/11 que funciona **completamente offline** sin necesidad de conexión a internet ni instalación de dependencias adicionales.

## Requisitos para compilar

- Node.js 18 o superior
- npm o yarn
- Windows 10/11 (para compilar el instalador .exe)

## Estructura del proyecto Electron

```
electron/
├── main.ts          # Proceso principal de Electron
└── preload.ts       # Script de preload (bridge entre renderer y main)

electron-dist/       # Archivos compilados de Electron
dist-electron/       # Frontend compilado para Electron

build-resources/     # Iconos y recursos para el instalador
├── icon.ico         # Icono para Windows
├── icon.png         # Icono para Linux
└── icon.icns        # Icono para macOS
```

## IMPORTANTE: Configurar package.json

**Debes añadir estos scripts manualmente a tu package.json en la sección `"scripts"`:**

```json
"scripts": {
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "tsx script/build.ts",
  "start": "NODE_ENV=production node dist/index.cjs",
  "check": "tsc",
  "db:push": "drizzle-kit push",
  "electron:build": "tsx script/build-electron.ts",
  "electron:package": "npm run electron:build && npx electron-builder --win --config electron-builder.json"
}
```

**Nota:** El script de build genera automáticamente un `package.json` dentro de `electron-app/` con la configuración correcta para Electron.

## Comandos

### Desarrollo (con hot-reload)

```bash
# Primero añade los scripts al package.json, luego:
npm run electron:dev
```

Esto iniciará el servidor de desarrollo y abrirá Electron apuntando a localhost:5000.

### Compilar para Windows

```bash
# Compilar el frontend y Electron
npm run electron:build

# Crear el instalador .exe
npx electron-builder --win --config electron-builder.json
```

El instalador se generará en la carpeta `release/`.

## Diferencias con la versión web

| Característica | Versión Web | Versión Electron |
|----------------|-------------|------------------|
| Base de datos | PostgreSQL | SQLite (local) |
| Autenticación | Sesiones en servidor | Sesión local |
| Almacenamiento | Remoto | AppData local |
| Conexión | Requiere internet | 100% offline |
| Instalación | Navegador | Instalador .exe |

## Datos locales

La aplicación de escritorio guarda todos los datos en:

- **Windows**: `%APPDATA%/OposTest Pro/opostest.db`
- **macOS**: `~/Library/Application Support/OposTest Pro/opostest.db`
- **Linux**: `~/.config/OposTest Pro/opostest.db`

## Iconos

Antes de compilar, añade los iconos a la carpeta `build-resources/`:

1. `icon.ico` - Icono de Windows (256x256 mínimo)
2. `icon.png` - Icono de Linux (512x512 recomendado)
3. `icon.icns` - Icono de macOS

Puedes usar herramientas online para convertir un PNG a ICO/ICNS.

## Solución de problemas

### Error "Cannot find module better-sqlite3"

```bash
npm rebuild better-sqlite3
```

### Error al compilar en Windows

Asegúrate de tener instalado:
- Visual Studio Build Tools
- Python 3.x

```bash
npm install --global windows-build-tools
```

### La aplicación no arranca

Verifica que el archivo `electron-dist/main.js` existe. Si no, ejecuta:

```bash
npm run electron:build
```

## Distribución

El instalador generado (`OposTest Pro-X.X.X-Setup.exe`) es autónomo e incluye:

- Tiempo de ejecución de Node.js embebido
- SQLite nativo compilado
- Todos los assets estáticos
- Sin dependencias externas

Los usuarios solo necesitan ejecutar el instalador y la aplicación estará lista para usar offline.
