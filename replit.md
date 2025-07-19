# Pomodoro Timer Application

## Overview

This is a full-stack Pomodoro timer application built with React frontend and Express backend. The application allows users to create and manage tasks with custom durations, run timer sessions, and track their productivity. It features a modern iOS-inspired design using Tailwind CSS and shadcn/ui components.

## Recent Changes

- **Serverless deployment ready**: Refactored Express server to export app for Vercel/Netlify deployment
- **Vercel configuration**: Added vercel.json with proper routing and build configuration
- **API directory structure**: Created api/index.ts entry point for serverless functions
- **Production/development separation**: Server only starts in development, exports app for production
- **Root-level index.html**: Moved index.html to root level with proper SEO meta tags
- **Session storage persistence**: Tasks and timer state persist across browser refreshes and restarts
- **Auto-progression**: Tasks automatically advance to next task without manual intervention

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas for request/response validation
- **Session Storage**: In-memory storage with fallback to database (connect-pg-simple)

## Key Components

### Data Layer
- **Database**: PostgreSQL hosted on Neon (currently using in-memory storage for development)
- **ORM**: Drizzle ORM with TypeScript support
- **Schema**: Shared schema definition between client and server with task/interval support
- **Migrations**: Drizzle Kit for database migrations
- **Task Structure**: Tasks have isInterval and parentTaskId fields for automatic break generation

### API Endpoints
- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update an existing task
- `DELETE /api/tasks/:id` - Delete a task

### Frontend Components
- **TimerDisplay**: Circular progress timer with iOS-style design and text wrapping
- **TaskItem**: Individual task management with inline editing and interval highlighting
- **TimePicker**: Touch-friendly duration selector with iPhone-style interface
- **NotificationManager**: macOS push notification system for task alerts
- **Custom UI Components**: Full shadcn/ui component library

### Storage Strategy
- **Development**: In-memory storage (MemStorage class)
- **Production**: PostgreSQL database with Drizzle ORM
- **Abstraction**: IStorage interface for flexible storage backends

## Data Flow

1. **Task Management**: Users create tasks with name and duration (defaults to 25 minutes)
2. **Automatic Intervals**: 5-minute break intervals are automatically created after each task
3. **Timer Sessions**: Users run sequential tasks and breaks with automatic progression
4. **Push Notifications**: macOS notifications sent at task completion and next task start
5. **Real-time Updates**: Timer state managed with React hooks and intervals
6. **Persistence**: Task data persisted via REST API calls
7. **Optimistic Updates**: UI updates immediately with server sync

## External Dependencies

### Database & Infrastructure
- **Neon Database**: PostgreSQL hosting
- **Drizzle ORM**: Database toolkit and migrations

### UI & Styling
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component system

### Development & Build
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across the stack
- **ESBuild**: Server-side bundling for production

## Deployment Strategy

The application is now configured for serverless deployment with multiple hosting options:

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: Express app exports for serverless functions
3. **Database**: Drizzle pushes schema changes to PostgreSQL (optional)

### Serverless Deployment
- **Vercel**: Uses `vercel.json` and `api/index.ts` entry point
- **Netlify**: Uses `netlify.toml` and `netlify/functions/api.ts` entry point
- **Traditional**: Express server can still run standalone

### Environment Configuration
- **Development**: Local dev server with HMR (port 5000)
- **Production**: Serverless functions handle API, static files served by CDN
- **Database**: Optional PostgreSQL, defaults to in-memory storage

### Deployment Commands
- `npm run dev` - Development with hot reloading
- `npm run build` - Production build for all platforms
- `npm start` - Traditional server mode
- `npm run db:push` - Deploy database schema (optional)

### Architecture Benefits
- **Type Safety**: Shared TypeScript schemas between client/server
- **Developer Experience**: Hot reloading, fast builds, modern tooling
- **Scalability**: Clean separation of concerns, modular architecture
- **Maintainability**: Strong typing, consistent patterns, reusable components