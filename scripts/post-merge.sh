#!/bin/bash
set -e

echo "=== Post-merge setup ==="

echo "Installing backend dependencies..."
cd backend && pip install -r requirements.txt -q && cd ..

echo "Installing frontend dependencies..."
cd frontend && yarn install --frozen-lockfile --silent && cd ..

echo "=== Done ==="
