# OposTest Pro

## Overview

OposTest Pro is a professional examination practice platform designed for Spanish civil service exam preparation ("oposiciones"). The application allows users to import question sets from JSON files, take randomized or sequential tests, track their progress with detailed history and charts, and manage questions through an admin dashboard. It supports connecting to remote servers to download additional test materials.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for page transitions and UI effects
- **Charts**: Recharts for score history visualization
- **Icons**: Lucide React

The frontend follows a page-based structure with reusable components:
- `pages/` - Main views (Home, TestView, Results, Admin)
- `components/` - Shared components (QuestionCard, ImportDialog, etc.)
- `components/ui/` - shadcn/ui primitives
- `hooks/` - Custom React hooks for data fetching (use-tests, use-results, use-attempts)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **API Design**: RESTful endpoints defined in shared route contracts (`shared/routes.ts`)
- **Validation**: Zod schemas for request/response validation

The backend serves both API routes and static files in production. In development, Vite middleware handles frontend hot-reloading.

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod integration for type-safe schemas
- **Schema Location**: `shared/schema.ts` contains table definitions for:
  - `questions` - Test questions imported from JSON files
  - `results` - Completed test scores and history
  - `testAttempts` - In-progress and completed test sessions

### Key Design Patterns
1. **Shared Types**: Schema and route definitions live in `shared/` directory, consumed by both frontend and backend
2. **Storage Abstraction**: `server/storage.ts` provides an interface layer over database operations
3. **Attempt Persistence**: Tests can be paused and resumed via the `testAttempts` table
4. **Seed Data**: Initial questions are auto-seeded from `attached_assets/` on first run

### Recent Features
- **Full Spanish (Spain) UI**: All interface text, toast notifications, and date formatting in Spanish
- **Context Menu on Tests**: Right-click on test cards in the library to access:
  - "Editar" - Navigate directly to admin panel for that test
  - "Cambiar nombre" - Rename the test
  - "Eliminar" - Delete the test with confirmation dialog
- **Continue Test**: Save progress mid-test and resume from History page
- **Dynamic Answer Options**: Admin panel supports 2-8 answer options per question

### PWA (Progressive Web App)
The application is configured as a PWA for installation on Windows, Android, and other platforms:
- **Manifest**: `client/public/manifest.json` with app metadata and icons
- **Service Worker**: `client/public/sw.js` with offline caching strategies
  - Network-first for API calls (caches responses for offline use)
  - Stale-while-revalidate for static assets
  - Offline fallback page for navigation when fully offline
- **Connection Status**: Startup animation showing online/offline status
- **Mobile Navigation**: Bottom navigation bar for mobile devices with:
  - Navigation to Inicio, Historial, Admin
  - Online/Offline indicator
- **Safe Area Support**: CSS support for notched phones (iOS/Android)

## External Dependencies

### Database
- **PostgreSQL**: Required via `DATABASE_URL` environment variable
- Connection pooling handled through `pg` package

### Third-Party Services
- **Remote Test Servers**: Optional HTTP endpoints for fetching additional question sets
- The app can connect to external servers to list and download JSON test files

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Async state management
- `recharts`: Score visualization charts
- `framer-motion`: Animation library
- `zod`: Runtime type validation
- `connect-pg-simple`: PostgreSQL session storage (available but may not be in active use)

### Build Tools
- **Vite**: Frontend bundling and development server
- **esbuild**: Production server bundling
- **tsx**: TypeScript execution for development

### Self-Hosting
- **Guide**: See `SELFHOSTING.md` for complete Ubuntu VPS installation instructions
- **Configuration**: Copy `.env.example` to `.env` and customize settings
- **Configurable Options** (via `.env`):
  - `DATABASE_URL`: PostgreSQL connection string
  - `PORT`: Server port (default: 5000)
  - `APP_NAME`: Application name shown in UI
  - `APP_DESCRIPTION`: Short description
  - `WELCOME_MESSAGE`: Loading screen message
  - `SESSION_SECRET`: Secret for session encryption

### Configuration API
- **Endpoint**: `GET /api/config` returns app configuration
- **Config file**: `server/config.ts` reads from environment variables with defaults