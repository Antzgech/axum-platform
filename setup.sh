#!/bin/bash

# Quick Start Script for Axum Platform
# This script helps you set up the development environment quickly

set -e

echo "🏛️ Axum Platform - Quick Start Setup"
echo "====================================="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 18+ first."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Please install npm 9+ first."; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "⚠️  PostgreSQL not found. You'll need to install it for the backend to work."; }

echo "✅ Prerequisites check passed"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating backend .env file..."
    cp .env.example .env
    
    # Generate JWT secret
    if command -v openssl >/dev/null 2>&1; then
        JWT_SECRET=$(openssl rand -base64 32)
        # Use sed to replace the JWT_SECRET in .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
        else
            # Linux
            sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
        fi
        echo "✅ Generated secure JWT_SECRET"
    fi
    
    echo "⚠️  Please edit backend/.env with your:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - TELEGRAM_BOT_TOKEN (from @BotFather)"
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

cd ..

# Frontend setup
echo ""
echo "📦 Setting up Frontend..."
cd frontend

if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file..."
    cp .env.example .env
    echo "⚠️  Please edit frontend/.env with your:"
    echo "   - REACT_APP_TELEGRAM_BOT_USERNAME"
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

cd ..

# Summary
echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Edit environment files:"
echo "   - backend/.env (add DATABASE_URL and TELEGRAM_BOT_TOKEN)"
echo "   - frontend/.env (add REACT_APP_TELEGRAM_BOT_USERNAME)"
echo ""
echo "2. Set up PostgreSQL database:"
echo "   createdb axum_db"
echo ""
echo "3. Start the backend:"
echo "   cd backend && npm start"
echo ""
echo "4. Start the frontend (in a new terminal):"
echo "   cd frontend && npm start"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
