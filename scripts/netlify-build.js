#!/usr/bin/env node
import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting Netlify build process...');

try {
  // Build the frontend with Vite
  console.log('📦 Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Copy redirects file
  console.log('🔄 Copying redirects file...');
  const redirectsSource = '_redirects';
  const redirectsTarget = join('dist', 'public', '_redirects');
  
  if (existsSync(redirectsSource)) {
    copyFileSync(redirectsSource, redirectsTarget);
    console.log('✅ Redirects file copied successfully');
  } else {
    console.log('⚠️  Redirects file not found, skipping...');
  }
  
  console.log('🎉 Build completed successfully!');
  
  // List output files for verification
  console.log('📂 Build output:');
  execSync('ls -la dist/public/', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}