#!/bin/bash
# HiWay Native Android Build Script
# Prerequisites: Node.js, npm, and an Expo account (expo.dev)
#
# Usage:
#   ./apps/build.sh rider    # Build rider APK via EAS cloud
#   ./apps/build.sh driver   # Build driver APK via EAS cloud
#   ./apps/build.sh all      # Build both

set -e

echo "╔══════════════════════════════════════════╗"
echo "║     HiWay Native Android Build Tool      ║"
echo "╚══════════════════════════════════════════╝"

build_app() {
  local name=$1
  local dir="apps/$name"

  echo ""
  echo "→ Building HiWay $name..."

  if [ ! -f "$dir/package.json" ]; then
    echo "  ✗ $dir/package.json not found"
    exit 1
  fi

  cd "$dir"

  if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
  fi

  echo "  Starting Expo build (EAS)..."
  echo "  This will build a native Android APK in the cloud."
  echo "  You need:"
  echo "    1. Expo account (expo.dev)"
  echo "    2. npx eas login"
  echo "    3. npx eas build:configure"
  echo ""
  echo "  Running: npx eas build -p android --profile preview"
  npx eas build -p android --profile preview

  cd ../..
  echo "  ✓ HiWay $name build complete"
}

case "${1:-all}" in
  rider)
    build_app "rider"
    ;;
  driver)
    build_app "driver"
    ;;
  all)
    build_app "rider"
    build_app "driver"
    ;;
  *)
    echo "Usage: $0 {rider|driver|all}"
    exit 1
    ;;
esac

echo ""
echo "✓ Build process complete"
echo "APKs will be available on expo.dev when ready."
