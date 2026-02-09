#!/bin/bash
# ============================================================================
# 同步围棋 (Simultaneous Go) - Build Script
# Copyright (C) 2026 三亚棋道工作室 (Sanya Chess Studio)
# Author: 步紧 (Bujin) | Version: 三亚001版
# ============================================================================

set -e

echo "=============================================="
echo "  同步围棋 - Simultaneous Go"
echo "  三亚001版 (v1.0.0-sanya001)"
echo "  三亚棋道工作室 Build Script"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Parse arguments
PLATFORM="${1:-all}"
CLEAN="${2:-}"

echo -e "${YELLOW}[INFO]${NC} Project root: $PROJECT_ROOT"
echo -e "${YELLOW}[INFO]${NC} Platform: $PLATFORM"
echo ""

# Step 1: Clean previous builds
if [ "$CLEAN" = "--clean" ] || [ "$CLEAN" = "-c" ]; then
  echo -e "${YELLOW}[STEP 1]${NC} Cleaning previous builds..."
  rm -rf dist/
  echo -e "${GREEN}[OK]${NC} Clean complete"
else
  echo -e "${YELLOW}[STEP 1]${NC} Skipping clean (use --clean flag to clean)"
fi

# Step 2: Install dependencies
echo -e "${YELLOW}[STEP 2]${NC} Installing dependencies..."
npm ci --production=false
echo -e "${GREEN}[OK]${NC} Dependencies installed"

# Step 3: Run tests
echo -e "${YELLOW}[STEP 3]${NC} Running tests..."
npm test || {
  echo -e "${RED}[ERROR]${NC} Tests failed! Aborting build."
  exit 1
}
echo -e "${GREEN}[OK]${NC} All tests passed"

# Step 4: Build
echo -e "${YELLOW}[STEP 4]${NC} Building application..."

case "$PLATFORM" in
  mac|macos|darwin)
    echo "Building for macOS..."
    npm run build:mac
    ;;
  win|windows)
    echo "Building for Windows..."
    npm run build:win
    ;;
  linux)
    echo "Building for Linux..."
    npm run build:linux
    ;;
  all)
    echo "Building for all platforms..."
    npm run build:all
    ;;
  *)
    echo -e "${RED}[ERROR]${NC} Unknown platform: $PLATFORM"
    echo "Usage: ./scripts/build.sh [mac|win|linux|all] [--clean]"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}=============================================="
echo "  Build Complete!"
echo "  Output: dist/"
echo "==============================================${NC}"
echo ""

# List output files
if [ -d "dist" ]; then
  echo "Built artifacts:"
  ls -la dist/ 2>/dev/null || true
fi
