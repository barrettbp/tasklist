# Vercel Deployment Guide

This guide will help you deploy your Pomodoro Timer application to Vercel in just a few clicks.

## Prerequisites

- GitHub, GitLab, or Bitbucket account with your code
- Vercel account (free at [vercel.com](https://vercel.com))

## Quick Deploy

### Option 1: One-Click Deploy (Recommended)
1. Push your code to a Git repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Click **Deploy** - that's it!

### Option 2: Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy to production
vercel --prod
```

## What Happens During Deployment

1. **Build Process**: Vercel automatically runs `npm run build`
2. **Frontend**: React app is built and served from CDN
3. **Backend**: Express routes become serverless functions in `/api`
4. **Routing**: All API calls go to serverless functions, everything else serves the React app

## Configuration Details

### Files Already Set Up
- ✅ `vercel.json` - Deployment configuration
- ✅ `api/index.ts` - Main serverless function handler
- ✅ `api/tasks.ts` - Tasks API endpoint handler
- ✅ `.vercelignore` - Files to exclude from deployment

### Environment Variables (Optional)
Only needed if you want to use a PostgreSQL database instead of in-memory storage:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add: `DATABASE_URL` with your PostgreSQL connection string

## Verification

After deployment:
1. Vercel provides a live URL (e.g., `your-app-name.vercel.app`)
2. Test the app - create tasks, run timers
3. Check browser developer tools - API calls should work
4. Notifications will work if you enable them in browser

## Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Settings → Domains
3. Add your custom domain
4. Follow DNS setup instructions

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation locally: `npm run check`

### API Not Working
- Check serverless function logs in Vercel dashboard
- Verify API routes work locally: `npm run dev`
- Ensure `vercel.json` routing is correct

### Static Files Not Loading
- Verify build output in `dist/public` directory
- Check that `npm run build` completes successfully
- Confirm static file paths in `index.html`

## Performance Optimization

The app is already optimized for Vercel:
- ⚡ Serverless functions for API endpoints
- 🚀 CDN delivery for static assets
- 📱 Automatic gzip compression
- 🔄 Edge caching for better performance

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- Check this project's README.md for local development