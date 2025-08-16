#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

# 1) Package chart (updates dependencies)
cd "$ROOT_DIR/helm"
helm package -u .

# 2) Move newest chart archive into manifests (replace old)
TGZ=$(ls -t *.tgz | head -n1)
mkdir -p "$ROOT_DIR/manifests"
rm -f "$ROOT_DIR/manifests"/*.tgz || true
mv "$TGZ" "$ROOT_DIR/manifests/"

# 3) Create release from manifests and promote to Unstable
cd "$ROOT_DIR/manifests"
replicated release create --app "${REPLICATED_APP:-vote}" --yaml-dir . --promote Unstable


