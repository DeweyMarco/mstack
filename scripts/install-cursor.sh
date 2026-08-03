#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$repo_root/plugins/mstack/skills"
target_dir="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"

if [[ ! -d "$source_dir" ]]; then
  echo "Could not find mstack skills at $source_dir" >&2
  exit 1
fi

mkdir -p "$target_dir"

for skill_dir in "$source_dir"/*; do
  [[ -d "$skill_dir" ]] || continue

  skill_name="$(basename "$skill_dir")"
  target_skill_dir="$target_dir/$skill_name"

  if [[ -d "$target_skill_dir" && ! -L "$target_skill_dir" ]]; then
    echo "Replacing copied directory $target_skill_dir with a symlink." >&2
    if ! diff -rq "$skill_dir" "$target_skill_dir" >/dev/null 2>&1; then
      echo "  Warning: it differs from the repo; local edits there will be lost." >&2
    fi
  fi

  rm -rf "$target_skill_dir"
  ln -s "$skill_dir" "$target_skill_dir"
  echo "Linked $skill_name -> $target_skill_dir"
done

echo
echo "mstack Cursor skills linked into $target_dir"
echo "They now track the repo, so edits in either place are the same file."
