#!/usr/bin/env bash
# Собирает сайт и выкладывает папку dist в ветку gh-pages (её раздаёт GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
cd dist
rm -rf .git
git init -q
git checkout -q -b gh-pages
git add -A
git commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f https://github.com/IZYWAY/card.git gh-pages
rm -rf .git
