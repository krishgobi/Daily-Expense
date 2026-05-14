#!/bin/bash
set -e

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "Running migrations..."
cd backend && alembic upgrade head || true

echo "Build complete!"
