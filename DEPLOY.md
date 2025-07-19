# Netlify Deployment Guide

Deploy your Pomodoro Timer app to Netlify in 3 simple steps!

## 🚀 Quick Deploy

1. **Push to Git**: Commit your code to GitHub/GitLab/Bitbucket
2. **Connect to Netlify**: Go to [app.netlify.com](https://app.netlify.com) → "New site from Git"
3. **Deploy**: Select repository → Click "Deploy site" ✨

That's it! Netlify will automatically:
- Detect build settings from `netlify.toml`
- Run `npm run build`
- Deploy to global CDN
- Set up serverless functions

## 🔧 Configuration (Pre-built)

✅ **netlify.toml** - Deployment settings  
✅ **netlify/functions/tasks.ts** - API handler  
✅ **.netlifyignore** - Excludes dev files  
✅ **Redirects** - Routes `/api/*` to functions  

## 🌐 After Deployment

Your app will be available at: `https://your-site-name.netlify.app`

Test these features:
- ✅ Create and manage tasks
- ✅ Timer functionality  
- ✅ Browser notifications
- ✅ Session persistence

## 🐛 Issues?

Check the Netlify dashboard for:
- Build logs
- Function logs  
- Deploy status

## 🎯 Success!

When everything works, you'll have a production Pomodoro timer with:
- Global CDN delivery
- Serverless API functions
- Automatic HTTPS
- Zero-downtime deploys