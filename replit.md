# Pomodoro Timer Application

## Overview

This is a full-stack Pomodoro timer application built with React frontend and Express backend. The application allows users to create and manage tasks with custom durations, run timer sessions, and track their productivity. It features a modern iOS-inspired design using Tailwind CSS and shadcn/ui components.

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
- **Database**: PostgreSQL hosted on Neon
- **ORM**: Drizzle ORM with TypeScript support
- **Schema**: Shared schema definition between client and server
- **Migrations**: Drizzle Kit for database migrations

### API Endpoints
- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update an existing task
- `DELETE /api/tasks/:id` - Delete a task

### Frontend Components
- **TimerDisplay**: Circular progress timer with iOS-style design
- **TaskItem**: Individual task management with inline editing
- **TimePicker**: Touch-friendly duration selector
- **Custom UI Components**: Full shadcn/ui component library

### Storage Strategy
- **Development**: In-memory storage (MemStorage class)
- **Production**: PostgreSQL database with Drizzle ORM
- **Abstraction**: IStorage interface for flexible storage backends

## Data Flow

1. **Task Management**: Users create tasks with name and duration
2. **Timer Sessions**: Users select tasks and run timed sessions
3. **Real-time Updates**: Timer state managed with React hooks and intervals
4. **Persistence**: Task data persisted via REST API calls
5. **Optimistic Updates**: UI updates immediately with server sync

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

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles server code to `dist/index.js`
3. **Database**: Drizzle pushes schema changes to PostgreSQL

### Environment Configuration
- **Development**: Local dev server with HMR
- **Production**: Express serves static files and API
- **Database**: CONNECTION_URL environment variable required

### Deployment Commands
- `npm run dev` - Development with hot reloading
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run db:push` - Deploy database schema

### Architecture Benefits
- **Type Safety**: Shared TypeScript schemas between client/server
- **Developer Experience**: Hot reloading, fast builds, modern tooling
- **Scalability**: Clean separation of concerns, modular architecture
- **Maintainability**: Strong typing, consistent patterns, reusable components