#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(os.environ.get('DATABASE_URL_PSYCOPG', 'dbname=thermora user=thermora password=thermora host=postgres'))
except Exception as e:
    sys.exit(1)
"; do
  sleep 2
done
echo "PostgreSQL is up."

python -m app.seed.seed_data || true

echo "Training ML models (this may take a minute on first boot)..."
python -m app.services.ml.train || true

echo "Starting Thermora API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
