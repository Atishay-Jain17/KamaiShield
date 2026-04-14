#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# KamaiShield — Setup Script
# Installs all dependencies and prepares the project for local development.
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit immediately on any error

# ── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         KamaiShield Setup                ║${NC}"
echo -e "${BLUE}║   Kamai aapki, suraksha humari           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}ERROR: Node.js is not installed.${NC}"
  echo "Please install Node.js 18 or higher from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}ERROR: Node.js 18+ required. You have $(node -v)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# ── Backend setup ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Create .env from example if it doesn't exist
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠  Created backend/.env from .env.example${NC}"
    echo -e "${YELLOW}   Please fill in your API keys in backend/.env before starting${NC}"
  else
    echo -e "${RED}WARNING: No .env.example found. Create backend/.env manually.${NC}"
  fi
else
  echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi

cd ..

# ── Frontend setup ────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Setup Complete!                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Required API keys (add to backend/.env):${NC}"
echo "  WEATHERAPI_KEY    → https://www.weatherapi.com  (free)"
echo "  OPENAQ_API_KEY    → https://openaq.org          (free)"
echo "  GEMINI_API_KEY    → https://aistudio.google.com (free)"
echo ""
echo -e "${BLUE}To start the application:${NC}"
echo ""
echo -e "  ${YELLOW}Terminal 1 — Backend:${NC}"
echo "    cd backend"
echo "    node server.js"
echo "    → Runs on http://localhost:5000"
echo ""
echo -e "  ${YELLOW}Terminal 2 — Frontend:${NC}"
echo "    cd frontend"
echo "    npm run dev"
echo "    → Runs on http://localhost:3000"
echo ""
echo -e "${BLUE}Test credentials:${NC}"
echo "  Admin  → phone: 0000000000  password: Admin@123"
echo "  Rider  → phone: 9111111111  password: Rider@123"
echo ""
echo -e "${YELLOW}Note: Admin account and test rider are auto-created on first server start.${NC}"
echo ""
