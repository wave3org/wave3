#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$1" == "supabase" ]; then
  echo "Setting up Supabase database..."
  read -p "Enter Supabase connection string: " DB_URL
  psql "$DB_URL" -f "$SCRIPT_DIR/init-db.sql"
  echo "Waiting for Ponder to create tables..."
  read -p "Press Enter once Ponder has created the tables..."
  psql "$DB_URL" -f "$SCRIPT_DIR/create-indexes.sql"
  echo "Done!"
else
  echo "Setting up local PostgreSQL..."
  docker exec wave3-postgres-1 psql -U wave3 -d wave3 -f /docker-entrypoint-initdb.d/../init-db.sql 2>/dev/null || \
  psql -U wave3 -d wave3 -h localhost -f "$SCRIPT_DIR/init-db.sql"
  docker exec wave3-postgres-1 psql -U wave3 -d wave3 -f /docker-entrypoint-initdb.d/../create-indexes.sql 2>/dev/null || \
  psql -U wave3 -d wave3 -h localhost -f "$SCRIPT_DIR/create-indexes.sql"
  echo "Done!"
fi
