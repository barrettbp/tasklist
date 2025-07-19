# Pomodoro Timer Application

A productivity-focused Pomodoro timer application with iPhone-style interface, automatic task sequencing, and smart break intervals for enhanced focus and time management.

## Features

- 🍎 iPhone-style time picker with smooth touch controls
- ⏰ Automatic task progression with 5-minute break intervals
- 📱 Responsive design for mobile, tablet, and desktop
- 🔔 Browser push notifications for task completion
- 💾 Session storage for task persistence across browser refreshes
- ✏️ Inline task editing with duration adjustment
- 🎯 Smart task management with clear all functionality

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **UI Framework**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Database**: PostgreSQL with Drizzle ORM (in-memory for development)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment on Vercel

This project is optimized for seamless deployment on Vercel:

### Automatic Deployment
1. **Connect Repository**: Link your GitHub/GitLab repository to Vercel
2. **Import Project**: Vercel will automatically detect the configuration
3. **Deploy**: Click deploy - no additional setup required!

### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy for preview
vercel
```

### Configuration
- `vercel.json` - Pre-configured for optimal deployment
- `api/` directory - Contains serverless functions
- Build command: `npm run build` (automatically detected)
- Output directory: `dist/public` (automatically detected)

### Environment Variables (Optional)
If using a PostgreSQL database, add these in Vercel dashboard:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV` - Set to "production" (automatically set by Vercel)

## Environment Variables

- `NODE_ENV`: Set to "production" for production builds
- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string (optional, uses in-memory storage by default)

## Project Structure

```
├── api/                 # Vercel serverless functions
│   ├── index.ts        # Main API handler
│   └── tasks.ts        # Tasks API endpoint
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Application pages
│   │   └── utils/      # Utility functions
│   └── index.html      # Original HTML template
├── server/             # Express backend (exports for serverless)
│   ├── index.ts        # Main server file
│   ├── routes.ts       # API routes
│   └── storage.ts      # Data storage layer
├── shared/             # Shared types and schemas
├── index.html          # Root-level HTML with SEO
├── vercel.json         # Vercel deployment configuration
├── .vercelignore       # Files to ignore during deployment
└── README.md           # This file
```

## License

MIT