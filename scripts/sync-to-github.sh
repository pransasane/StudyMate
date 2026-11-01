#!/usr/bin/env bash
set -e

echo "===================================================="
echo "  StudyMate -> GitHub Auto-Sync & AI Secret Setup   "
echo "===================================================="

# Check if GH_TOKEN or argument 1 is provided
TOKEN="${1:-$GH_TOKEN}"
REPO="${2:-$GITHUB_REPO}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: GitHub Token not provided."
  echo "Usage: ./scripts/sync-to-github.sh <GITHUB_TOKEN> [username/repo-name]"
  echo "Example: ./scripts/sync-to-github.sh ghp_xxxx pranaysasane/studymate"
  exit 1
fi

echo "🔑 Authenticating with GitHub..."
echo "$TOKEN" | gh auth login --with-token

GH_USER=$(gh api user --jq .login 2>/dev/null || echo "")
echo "✅ Authenticated as GitHub user: @$GH_USER"

# Determine repository target
if [ -z "$REPO" ]; then
  REPO="$GH_USER/studymate"
fi

echo "📦 Target repository: $REPO"

# Check if repository already exists on GitHub
if gh repo view "$REPO" &>/dev/null; then
  echo "ℹ️  Repository $REPO exists on GitHub."
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$REPO.git"
else
  echo "🚀 Creating repository $REPO on GitHub..."
  gh repo create "$REPO" --public --source=. --remote=origin --description "StudyMate - AI-Powered Study Assistant & Note Summarizer"
fi

echo "⬆️  Pushing main branch to GitHub..."
git branch -M main
git push -u origin main

# Configure GEMINI_API_KEY in GitHub Actions Secrets
GEMINI_KEY="${GEMINI_API_KEY:-AQ.Ab8RN6KzjtsXY2gmPolegxo32-30yYK-aI1YfNQDQaoQrYhdww}"

if [ -n "$GEMINI_KEY" ]; then
  echo "🔒 Setting GEMINI_API_KEY in GitHub Repository Secrets ($REPO)..."
  echo "$GEMINI_KEY" | gh secret set GEMINI_API_KEY --repo "$REPO"
  echo "✅ GEMINI_API_KEY successfully set in GitHub Repository Secrets!"
else
  echo "⚠️  GEMINI_API_KEY was not found in environment. Please set it manually."
fi

echo ""
echo "===================================================="
echo "🎉 SUCCESS: Everything is pushed and configured!"
echo "Repository: https://github.com/$REPO"
echo "Secrets:    https://github.com/$REPO/settings/secrets/actions"
echo "Workflows:  https://github.com/$REPO/actions"
echo "===================================================="
