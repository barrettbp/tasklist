# Netlify Deployment Guide

Deploy your Pomodoro Timer app to Netlify in 3 simple steps!

## 🚀 Quick Deploy

1. **Push to Git**: Commit your code to GitHub/GitLab/Bitbucket
2. **Connect to Netlify**: Go to [app.netlify.com](https://app.netlify.com) → "New site from Git"
3. **Deploy**: Select repository → Click "Deploy site" ✨

That's it! Netlify will automatically:
- Detect build settings from `netlify.toml`
- Run `npm run build && cp _redirects dist/public/_redirects`
- Deploy to global CDN
- Set up serverless functions

## 🔧 Configuration (Pre-built)

✅ **netlify.toml** - Deployment settings with redirects  
✅ **_redirects** - Backup redirect rules copied to build  
✅ **netlify/functions/tasks.ts** - Main API handler  
✅ **netlify/functions/debug.ts** - Debug endpoint  
✅ **.netlifyignore** - Excludes dev files  

## 🌐 After Deployment

Your app will be available at: `https://your-site-name.netlify.app`

### Testing Checklist:
1. **Frontend**: Main page loads correctly
2. **API Debug**: Visit `/api/debug` to test functions
3. **Tasks API**: Check `/api/tasks` returns empty array
4. **Full App**: Create tasks and run timers

## 🐛 Troubleshooting

### If you get 404 errors:

1. **Check Function Logs** in Netlify dashboard
2. **Test Debug Endpoint**: `/api/debug` should return JSON
3. **Verify Redirects**: Look for "Redirect rules processed" in deploy log
4. **Check Build Log**: Ensure `_redirects` file was copied

### Common Issues:
- **404 on `/api/tasks`**: Check function deployment and redirects
- **CORS errors**: Function includes proper headers
- **Build failures**: Check Node.js version compatibility

### Debug Commands:
```bash
# Local testing
npm run build
npm run dev

# Check if redirects file exists
ls -la dist/public/_redirects
```

## 📊 Verify Deployment

After deployment, test these URLs:
- `https://your-site.netlify.app` - Main app
- `https://your-site.netlify.app/api/debug` - Function test
- `https://your-site.netlify.app/api/tasks` - API endpoint

## 🎯 Success Indicators

✅ Main page loads without errors  
✅ `/api/debug` returns JSON response  
✅ `/api/tasks` returns `[]` (empty tasks array)  
✅ Can create and manage tasks  
✅ Timer sessions work end-to-end  

## 🔍 Performance

Your deployed app includes:
- Global CDN delivery
- Serverless API functions
- Automatic HTTPS
- Zero-downtime deploys
- Edge computing optimization