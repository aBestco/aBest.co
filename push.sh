#!/bin/bash
# aBest.co – Push Script
# Führe aus: bash push.sh  (im Verzeichnis ~/Documents/Claude/aBest.co)
echo "🚀 Pushing 3 commits to GitHub..."
echo ""
git log --oneline origin/main..HEAD
echo ""
git push
echo ""
echo "✅ Done! GitHub Actions deployes automatically."
