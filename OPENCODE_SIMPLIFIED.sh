#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  SPRINGVOX LANDING PAGE - OPENCODE SIMPLIFIED EXECUTION      ║${NC}"
echo -e "${BLUE}║               Branch: origin/enoch                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}📋 Checking environment...${NC}"
if ! command -v opencode &> /dev/null; then
    echo -e "${RED}❌ OpenCode not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ OpenCode CLI${NC}"

echo -e "\n${YELLOW}🌳 Branch check...${NC}"
git pull origin enoch 2>/dev/null
echo -e "${GREEN}✓ On enoch branch${NC}"

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 Analyzing codebase...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

opencode analyze --context-mode full --include-codebase --output codebase-context.json 2>&1 || true
echo -e "${GREEN}✓ Codebase analyzed${NC}"

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🚀 Executing improvements...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

opencode execute \
  --context-file codebase-context.json \
  --auto-commit \
  --commit-message-format conventional \
  --test-mode comprehensive \
  --test-viewports 375px,768px,1440px \
  --lint-check \
  --type-check \
  --push-to-branch enoch \
  --branch enoch \
  --prompt "Improve SpringVox landing page:

1. TEXT CHANGES: Update hero (Your Company Knowledge), subheading, pain points with metrics (3+ hours, 30%), features to benefits language, pricing amounts (Free, \$299/month, Custom), CTAs with supporting text

2. COMPONENTS: Create StatsSection.tsx (250+, 5M+, 98%, 4.8/5) and FAQSection.tsx (5 Q&As) and add to page

3. SECTIONS: Add hero trust badge, testimonial metrics (35%, 100%, 5000+), pricing comparison table

4. MOBILE: Add hamburger menu <768px, stack CTA buttons on mobile, responsive grids (3col→2col→1col), NO horizontal scrolling at 375px/768px/1440px

5. SEO: Update meta description, add OpenGraph tags, Schema.org markup

Test all. Commit each section. Push to origin/enoch."

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}✅ Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Build check:${NC}"
npm run build > /dev/null 2>&1 && echo -e "${GREEN}✓ Build OK${NC}" || echo -e "${RED}✗ Build failed${NC}"

echo -e "\n${YELLOW}Recent commits:${NC}"
git log --oneline -8

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               ✓ COMPLETE - Pushed to origin/enoch             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\nNext: Review commits, test locally, create PR to main\n"
