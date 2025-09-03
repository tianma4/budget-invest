#!/bin/sh
CUR_DIR=$(dirname "$0");

# Remove the outdated package-lock.json to force regeneration
echo "Removing outdated package-lock.json to force fresh dependency resolution..."
rm -f package-lock.json

if [ -x "${CUR_DIR}/custom-frontend-pre-setup.sh" ]; then
  "${CUR_DIR}"/custom-frontend-pre-setup.sh
fi
