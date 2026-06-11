#!/usr/bin/env bash
set -euo pipefail
OUT=${1:-deploy.zip}
TMP=$(mktemp -d)
# Copy tracked files preserving paths
git ls-files -z | xargs -0 -I{} sh -c 'mkdir -p "$(dirname "$TMP/$1")" && cp -a "$1" "$TMP/$1"' _ {}
# If there's a local discloud.config (possibly untracked), include it
if [ -f discloud.config ]; then
  mkdir -p "$TMP/."
  cp -a discloud.config "$TMP/discloud.config"
fi
# Create zip
pushd "$TMP" >/dev/null
zip -r "../$OUT" . > /dev/null
popd >/dev/null
rm -rf "$TMP"
echo "Created $OUT"
