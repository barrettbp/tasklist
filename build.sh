#!/bin/bash
set -e

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the frontend
echo "Building frontend with Vite..."
npx vite build

# Copy redirects file
echo "Copying redirects file..."
cp _redirects dist/public/_redirects

echo "Build completed successfully!"
echo "Output directory: dist/public"
echo "Files:"
ls -la dist/public/