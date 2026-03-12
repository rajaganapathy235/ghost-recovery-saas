#!/bin/bash

# Ghost Customer Recovery System - Deployment Script
# Optimized for Ubuntu VPS

set -e

echo "🚀 Starting Ghost SaaS Deployment..."

# 1. Check for Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: Docker is not installed. Please install Docker first." >&2
  exit 1
fi

# 2. Create environment file if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env from template..."
  cp .env.example .env || echo "DATABASE_URL=postgresql://postgres:ghost_secure_password@db:5432/ghost_recovery?schema=public" > .env
  echo "⚠️ Please update .env with secure production values!"
fi

# 3. Build and Start Containers
echo "📦 Building and starting containers..."
docker compose up -d --build

# 4. Run database migrations
echo "🗄️ Running Prisma migrations..."
docker compose exec app npx prisma migrate deploy

# 5. Setup SSL (Optional/Placeholder)
echo "🔒 SSL Setup: Make sure to configure Certbot for your domain."

echo "✅ Deployment successful! System live at http://your-vps-ip"
echo "Check logs with: docker compose logs -f"
