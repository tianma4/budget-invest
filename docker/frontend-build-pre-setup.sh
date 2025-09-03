#!/bin/sh
CUR_DIR=$(dirname "$0");

# Remove the outdated package-lock.json to force regeneration
echo "Removing outdated package-lock.json to force fresh dependency resolution..."
rm -f package-lock.json

# Also remove node_modules to ensure clean install (fixes Rollup optional dependency issues)
echo "Removing node_modules to ensure clean dependency installation..."
rm -rf node_modules

if [ -x "${CUR_DIR}/custom-frontend-pre-setup.sh" ]; then
  "${CUR_DIR}"/custom-frontend-pre-setup.sh
fi
