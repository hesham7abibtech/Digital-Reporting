#!/bin/bash
# Ultra-Robust Cloudflare Build Script for Windows
echo "⚡️ Initializing High-Compatibility Build..."

# Inject shim and node into PATH
export PATH=$PATH:.
export PATH=$PATH:/c/Program\ Files/nodejs

# Ensure shim is executable
chmod +x npx

echo "⚡️ Running Edge Transformation..."
npx @cloudflare/next-on-pages