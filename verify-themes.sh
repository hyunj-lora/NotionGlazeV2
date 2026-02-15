#!/bin/bash

# Theme Verification Script
# Checks if all themes are exported and accessible in the registry.

THEMES=("zero" "tech" "minimal" "gallery" "paper" "brutal" "zen" "terminal")
REGISTRY="packages/themes/src/index.ts"

echo "--- NotionGlaze Theme Verification ---"

# 1. Check Registry Exports
echo "[1/2] Checking registry exports in $REGISTRY..."
for theme in "${THEMES[@]}"; do
    if grep -q "$theme: () => import('./$theme/HomeView.astro')" "$REGISTRY"; then
        echo "✅ HomeView for '$theme' registered."
    else
        echo "❌ HomeView for '$theme' MISSING or improperly formatted."
        exit 1
    fi

    if grep -q "$theme: () => import('./$theme/PostView.astro')" "$REGISTRY"; then
        echo "✅ PostView for '$theme' registered."
    else
        echo "❌ PostView for '$theme' MISSING or improperly formatted."
        exit 1
    fi
done

# 2. Check File Existence
echo "[2/2] Checking theme component files..."
for theme in "${THEMES[@]}"; do
    if [ -f "packages/themes/src/$theme/HomeView.astro" ] && [ -f "packages/themes/src/$theme/PostView.astro" ]; then
        echo "✅ Component files for '$theme' exist."
    else
        echo "❌ Component files for '$theme' are MISSING."
        exit 1
    fi
done

echo "--- 🎉 All Themes Verified Successfully! ---"
