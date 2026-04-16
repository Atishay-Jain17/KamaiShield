#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# KamaiShield Setup Script
# "Kamai aapki, suraksha humari."
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "  ${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "  ${CYAN}║        KamaiShield Setup             ║${NC}"
echo -e "  ${CYAN}║  Kamai aapki, suraksha humari.       ║${NC}"
echo -e "  ${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "  ${RED}✗${NC} Node.js not found. Install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "  ${RED}✗${NC} Node.js 18+ required. Current: $(node -v)"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# ── Backend setup ─────────────────────────────────────────────────────────
echo ""
echo -e "  ${CYAN}▸ Setting up backend...${NC}"

if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo -e "  ${YELLOW}⚠${NC}  Created backend/.env from .env.example"
  echo -e "  ${YELLOW}⚠${NC}  Please add your API keys to backend/.env before starting"
fi

echo -e "  Installing backend dependencies..."
(cd backend && npm install --silent)
echo -e "  ${GREEN}✓${NC} Backend ready"

# ── Frontend setup ────────────────────────────────────────────────────────
echo ""
echo -e "  ${CYAN}▸ Setting up frontend...${NC}"
echo -e "  Installing frontend dependencies..."
(cd frontend && npm install --silent)
echo -e "  ${GREEN}✓${NC} Frontend ready"

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${CYAN}══════════════════════════════════════${NC}"
echo -e "  ${GREEN}Setup complete!${NC}"
echo ""
echo -e "  ${CYAN}To start the application:${NC}"
echo ""
echo -e "  Terminal 1 (Backend):"
echo -e "    ${YELLOW}cd backend && node server.js${NC}"
echo ""
echo -e "  Terminal 2 (Frontend):"
echo -e "    ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo -e "  ${CYAN}URLs:${NC}"
echo -e "    Frontend  →  http://localhost:3000"
echo -e "    Backend   →  http://localhost:5000"
echo ""
echo -e "  ${CYAN}Test Credentials:${NC}"
echo -e "    Admin  →  0000000000 / Admin@123"
echo -e "    Rider  →  9111111111 / Rider@123"
echo ""
echo -e "  ${YELLOW}Note: Add your API keys to backend/.env before starting${NC}"
echo -e "  ${CYAN}══════════════════════════════════════${NC}"
echo ""
