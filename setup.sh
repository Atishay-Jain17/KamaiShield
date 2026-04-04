#!/bin/bash
set -e
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
echo -e "\n  ${CYAN}🛡️  KamaiShield — Setup${NC}\n  ━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v node &> /dev/null; then echo "❌ Node.js not found. Install from nodejs.org (v18+)"; exit 1; fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo -e "  ${YELLOW}⚠${NC}  Created backend/.env — edit JWT_SECRET before production!"
fi

echo -e "\n  📦 Installing backend..."; cd backend && npm install --silent && echo -e "  ${GREEN}✓${NC} Backend ready"
echo -e "\n  📦 Installing frontend..."; cd ../frontend && npm install --silent && echo -e "  ${GREEN}✓${NC} Frontend ready"
echo -e "\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}🚀 Starting KamaiShield...${NC}\n"
echo -e "  Frontend → ${CYAN}http://localhost:3000${NC}"
echo -e "  Backend  → ${CYAN}http://localhost:5000${NC}\n"
echo "  🔧 Admin  → 0000000000 / admin123"
echo "  👤 Rider  → 9111111111 / demo123 (after seeding)"
echo -e "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

cd ../backend && npm run dev &
BACKEND_PID=$!
sleep 2
cd ../frontend && npm run dev
kill $BACKEND_PID 2>/dev/null
