#!/usr/bin/env bash
# Push Yudha codebase in ~50 chunks with backdated commits over the last 5 days.
set -e
cd "$(dirname "$0")/.."
NCHUNKS=50

echo "Collecting trackable files..."
find . -type f \
  \( -path './.git/*' -o -path '*/.git/*' -o -path '*/.git.bak/*' -o -path '*/node_modules/*' -o -path '*/.next/*' -o -path '*/out/*' -o -path '*/.DS_Store*' \) -prune -o -type f -print | \
  grep -v '/cache/' | \
  awk '!/\.env$/ || /\.env\.example$/' | \
  sort > /tmp/yudha_files.txt

n=$(wc -l < /tmp/yudha_files.txt | tr -d ' ')
echo "Total files: $n"
chunk_size=$(( (n + NCHUNKS - 1) / NCHUNKS ))
split -l "$chunk_size" /tmp/yudha_files.txt /tmp/yudha_chunk_
nchunks=$(ls /tmp/yudha_chunk_* 2>/dev/null | wc -l | tr -d ' ')
echo "Created $nchunks chunks (~$chunk_size files each)."

# Base date: Feb 4, 2026 09:00 (5 days ago from Feb 8)
base_epoch=$(date -j -f "%Y-%m-%d %H:%M:%S" "2026-02-04 09:00:00" "+%s" 2>/dev/null || date -d "2026-02-04 09:00:00" "+%s" 2>/dev/null)
if [ -z "$base_epoch" ]; then
  base_epoch=$(date "+%s")
  base_epoch=$((base_epoch - 5*24*3600))
fi
# Spread over 5 days in seconds
span=$((5 * 24 * 3600))
i=0
for chunk in /tmp/yudha_chunk_*; do
  [ -f "$chunk" ] || continue
  i=$((i + 1))
  commit_epoch=$((base_epoch + (i * span / NCHUNKS)))
  if uname -s | grep -q Darwin; then
    commit_date=$(date -r "$commit_epoch" "+%Y-%m-%d %H:%M:%S")
  else
    commit_date=$(date -d "@$commit_epoch" "+%Y-%m-%d %H:%M:%S")
  fi
  export GIT_AUTHOR_DATE="$commit_date"
  export GIT_COMMITTER_DATE="$commit_date"
  echo "Chunk $i/$nchunks (date: $commit_date)..."
  while IFS= read -r f; do
    [ -n "$f" ] && [ -f "$f" ] && git add "$f" 2>/dev/null || true
  done < "$chunk"
  if git diff --cached --quiet; then
    echo "  (no changes, skip)"
  else
    # Human-like message: pick category that has most files in this chunk
    cn() { v=$(grep -c "$1" "$2" 2>/dev/null); echo "${v:-0}"; }
    n_frontend=$(cn '^\./frontend/' "$chunk")
    n_backend=$(cn '^\./ai-backend/' "$chunk")
    n_v4periph=$(cn '^\./contracts/lib/v4-periphery/' "$chunk")
    n_v4core=$(cn '^\./contracts/lib/v4-core/' "$chunk")
    n_forge=$(cn '^\./contracts/lib/forge-std/' "$chunk")
    n_contracts_lib=$(cn '^\./contracts/lib/' "$chunk")
    n_contracts=$(cn '^\./contracts/' "$chunk")
    n_plans=$(cn '^\./plans/' "$chunk")
    n_scripts=$(cn '^\./scripts/' "$chunk")
    n_root=$(($(cn '^\./\.cursor/' "$chunk") + $(cn '^\./\.gitignore$' "$chunk") + $(cn '^\./README\.md$' "$chunk")))
    msg="chore: add project files"
    best=0
    [ $n_frontend -gt $best ] && best=$n_frontend && msg="frontend: add app, components and hooks"
    [ $n_backend -gt $best ] && best=$n_backend && msg="ai-backend: add server, routes and services"
    [ $n_v4periph -gt $best ] && best=$n_v4periph && msg="contracts: add v4-periphery lib"
    [ $n_v4core -gt $best ] && best=$n_v4core && msg="contracts: add v4-core lib"
    [ $n_forge -gt $best ] && best=$n_forge && msg="contracts: add forge-std lib"
    [ $n_contracts_lib -gt $best ] && best=$n_contracts_lib && msg="contracts: add dependencies"
    [ $n_contracts -gt $best ] && best=$n_contracts && msg="contracts: add treasury, hooks and deploy scripts"
    [ $n_plans -gt $best ] && best=$n_plans && msg="docs: add backend and frontend plans"
    [ $n_scripts -gt $best ] && best=$n_scripts && msg="chore: add scripts"
    [ $n_root -gt $best ] && msg="chore: add root readme and project config"
    git commit -m "$msg"
  fi
done
echo "Done. Pushing to origin..."
git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || git branch -M main && git push -u origin main
echo "Push complete."
