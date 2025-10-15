#!/bin/bash

echo "=== Starting Build Process ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Build Vite frontend
echo "=== Building React frontend ==="
cd frontend
echo "Frontend directory: $(pwd)"
npm install
npm run build

echo "=== Checking frontend build ==="
ls -la dist/

cd ..

echo "=== Copying build files to backend ==="
mkdir -p backend/dist
cp -r frontend/dist/* backend/dist/

echo "=== Checking backend dist directory ==="
ls -la backend/dist/

echo "=== Build completed successfully! ==="