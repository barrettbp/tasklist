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

## Deployment

### Vercel
1. Connect your repository to Vercel
2. The `vercel.json` configuration is already set up
3. Deploy with: `vercel --prod`

### Netlify
1. Connect your repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist/public`
4. The `netlify.toml` configuration handles serverless functions

### Traditional Hosting
1. Run `npm run build` to build the application
2. Serve the `dist/public` directory as static files
3. Run the Express server with `npm start`

## Environment Variables

- `NODE_ENV`: Set to "production" for production builds
- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string (optional, uses in-memory storage by default)

## Project Structure

```
├── api/                 # Serverless function entry points
├── client/             # React frontend
│   ├── src/
│   ├── components/     # React components
│   ├── pages/          # Application pages
│   ├── utils/          # Utility functions
│   └── index.html      # Original HTML template
├── server/             # Express backend
│   ├── index.ts        # Main server file (exports app for serverless)
│   ├── routes.ts       # API routes
│   └── storage.ts      # Data storage layer
├── shared/             # Shared types and schemas
├── netlify/            # Netlify functions
├── index.html          # Root-level HTML with SEO
├── vercel.json         # Vercel deployment configuration
└── netlify.toml        # Netlify deployment configuration
```

## License

MIT