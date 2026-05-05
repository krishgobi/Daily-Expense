web: cd backend && pip install --upgrade pip setuptools wheel && pip install --prefer-binary -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port $PORT
release: cd backend && alembic upgrade head
