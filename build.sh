#!/usr/bin/env bash
set -e

echo "==> Installing Python dependencies..."
cd backend

# Upgrade pip and install build tools first
pip install --upgrade pip setuptools wheel

# Install requirements with legacy resolver to avoid Render's read-only filesystem issues
pip install --no-cache-dir --no-build-isolation -r requirements.txt

echo "==> Running database migrations..."
alembic upgrade head

echo "==> Build complete!"
