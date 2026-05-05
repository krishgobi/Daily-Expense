#!/bin/bash
set -e

echo "Installing dependencies..."
pip install --upgrade pip
pip install --no-build-isolation --prefer-binary -r backend/requirements.txt

echo "Running migrations..."
cd backend && alembic upgrade head || true

echo "Build complete!"
