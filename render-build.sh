#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Build the server
echo "Building server..."
npm run build:ssr

echo "Build completed successfully!"

exit 0
