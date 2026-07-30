#!/usr/bin/env bash
set -Eeuo pipefail

NEW_REPO_NAME="${1:-richmack-the-forest}"
VERSION="${2:-v2.1.0}"
DESCRIPTION="${3:-Richmack: The Forest is an optimized browser-based haunted open-world driving survival game built with Three.js.}"

OWNER="$(gh api user --jq .login)"
CURRENT_REMOTE="$(git remote get-url origin 2>/dev/null || true)"

echo
echo "============================================================"
echo "RICHMACK: THE FOREST — GITHUB RELEASE"
echo "============================================================"
echo "Owner:       $OWNER"
echo "Repository:  $NEW_REPO_NAME"
echo "Version:     $VERSION"
echo "Description: $DESCRIPTION"
echo

command -v git >/dev/null || { echo "git is required."; exit 1; }
command -v gh >/dev/null || { echo "GitHub CLI is required."; exit 1; }
command -v node >/dev/null || { echo "Node.js 18+ is required."; exit 1; }

gh auth status

echo
echo "Running tests..."
npm run test:all

echo
echo "Preparing Git repository..."
if [ ! -d .git ]; then
  git init
fi

git branch -M main

if [ -n "$CURRENT_REMOTE" ]; then
  CURRENT_REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || true)"

  if [ -n "$CURRENT_REPO" ]; then
    CURRENT_NAME="${CURRENT_REPO#*/}"

    if [ "$CURRENT_NAME" != "$NEW_REPO_NAME" ]; then
      echo "Renaming $CURRENT_REPO to $NEW_REPO_NAME..."
      gh repo rename "$NEW_REPO_NAME" --yes
    fi

    gh repo edit "$OWNER/$NEW_REPO_NAME" \
      --description "$DESCRIPTION" \
      --homepage "https://richmack111.com" \
      --add-topic threejs \
      --add-topic javascript \
      --add-topic browser-game \
      --add-topic driving-game \
      --add-topic survival-game \
      --add-topic richmack

    git remote set-url origin "git@github.com:${OWNER}/${NEW_REPO_NAME}.git"
  fi
else
  echo "Creating private GitHub repository..."
  gh repo create "$OWNER/$NEW_REPO_NAME" \
    --private \
    --description "$DESCRIPTION" \
    --homepage "https://richmack111.com" \
    --source . \
    --remote origin
fi

echo
echo "Committing project..."
git add .
git commit -m "Release Richmack: The Forest ${VERSION}" || true

echo
echo "Pushing main..."
git push -u origin main

echo
echo "Creating tag..."
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "Tag $VERSION already exists locally."
else
  git tag -a "$VERSION" -m "Richmack: The Forest ${VERSION}"
fi

git push origin "$VERSION"

ARCHIVE="richmack-the-forest-${VERSION}.zip"
rm -f "$ARCHIVE"
git archive --format=zip --output="$ARCHIVE" HEAD

echo
echo "Creating GitHub release..."
if gh release view "$VERSION" >/dev/null 2>&1; then
  gh release upload "$VERSION" "$ARCHIVE" --clobber
else
  gh release create "$VERSION" "$ARCHIVE" \
    --title "Richmack: The Forest ${VERSION}" \
    --notes-file RELEASE_NOTES.md
fi

echo
echo "Verifying repository and release..."
gh repo view "$OWNER/$NEW_REPO_NAME" \
  --json nameWithOwner,description,url,visibility,homepageUrl \
  --jq '.'

gh release view "$VERSION"

echo
echo "Release complete."
