# Taskmodoro - Pomodoro Timer Application v 1.2

A productivity-focused Pomodoro timer application with iPhone-style interface, automatic task sequencing, and smart break intervals for enhanced focus and time management.

## Features

- 🍎 Elegant style time picker with smooth touch controls
- ⏰ Automatic task progression with 5-minute break intervals
- 📱 Responsive design for mobile, tablet, and desktop
- 🔔 Browser push notifications for task completion
- 💾 Session storage for task persistence across browser refreshes
- ✏️ Inline task editing with duration adjustment

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js (development) / Netlify Functions (production)
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

# Start production server (local testing)
npm start
```

## Deployment on Netlify

This project is optimized for seamless deployment on Netlify:

### Automatic Deployment
1. **Connect Repository**: Link your GitHub/GitLab repository to Netlify
2. **Import Project**: Netlify will automatically detect the configuration
3. **Deploy**: Click deploy - no additional setup required!

### Manual Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
netlify deploy --prod --dir=dist/public
```

### Configuration
- `netlify.toml` - Pre-configured for optimal deployment
- `netlify/functions/` - Contains serverless functions
- Build command: `npm run build` (automatically detected)
- Publish directory: `dist/public` (automatically detected)

### Environment Variables (Optional)
If using a PostgreSQL database, add these in Netlify dashboard:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV` - Set to "production" (automatically set by Netlify)

## Environment Variables

- `NODE_ENV`: Set to "production" for production builds
- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string (optional, uses in-memory storage by default)

## Project Structure

```
├── netlify/            # Netlify serverless functions
│   └── functions/
│       └── tasks.ts    # Tasks API endpoint
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Application pages
│   │   └── utils/      # Utility functions
│   └── index.html      # Original HTML template
├── server/             # Express backend (development only)
│   ├── index.ts        # Main server file
│   ├── routes.ts       # API routes
│   └── storage.ts      # Data storage layer
├── shared/             # Shared types and schemas
├── index.html          # Root-level HTML with SEO
├── netlify.toml        # Netlify deployment configuration
└── README.md           # This file
```

## License

MIT
