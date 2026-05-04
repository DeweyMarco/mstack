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

  rm -rf "$target_skill_dir"
  cp -R "$skill_dir" "$target_skill_dir"
  echo "Installed $skill_name -> $target_skill_dir"
done

echo
echo "mstack Cursor skills installed in $target_dir"
