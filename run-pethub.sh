#!/bin/zsh

# Simple helper script to run the PetHub server.
# Usage: double-click in Finder (if set to open with Terminal) or run:
#   ./run-pethub.sh

cd "$(dirname "$0")" || exit 1

echo "Installing dependencies (if needed)..."
npm install

echo "Starting PetHub on port 4000..."
npm start


