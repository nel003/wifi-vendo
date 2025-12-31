#!/bin/bash

# ---------------------------------
# Config
# ---------------------------------
RETRY_DELAY=5

# ---------------------------------
# Resolve .env.local from script dir
# ---------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.local"

# ---------------------------------
# Main loop
# ---------------------------------
while true; do
  ERROR=0

  # ---------------------------------
  # Load environment
  # ---------------------------------
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ ENV file not found: $ENV_FILE"
    ERROR=1
  else
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi

  # ---------------------------------
  # Validate variables
  # ---------------------------------
  for v in DB_HOST DB_USER DB_PASSWORD DB_NAME; do
    [[ -z "${!v}" ]] && {
      echo "❌ Missing env: $v"
      ERROR=1
    }
  done

  # ---------------------------------
  # Query database
  # ---------------------------------
  if [[ "$ERROR" -eq 0 ]]; then
    QUERY="
    SELECT mac, expire_on, paused
    FROM clients
    WHERE expire_on >= NOW();
    "

    RESULT=$(mysql \
      -h "$DB_HOST" \
      -u "$DB_USER" \
      -p"$DB_PASSWORD" \
      -D "$DB_NAME" \
      -sN -e "$QUERY" 2>/tmp/ipset-mysql.err
    ) || ERROR=1
  fi

  # ---------------------------------
  # Process clients
  # ---------------------------------
  if [[ "$ERROR" -eq 0 ]]; then
    NOW_TIMESTAMP=$(date +%s)

    while IFS=$'\t' read -r mac expire_on paused; do
      [[ -z "$mac" ]] && continue
      [[ "$paused" -ne 0 ]] && continue

      EXPIRE_TIMESTAMP=$(date -d "$expire_on" +%s)
      TIMEOUT=$((EXPIRE_TIMESTAMP - NOW_TIMESTAMP))

      [[ "$TIMEOUT" -le 0 ]] && continue
      [[ "$TIMEOUT" -gt 2147483 ]] && TIMEOUT=2147483

      ipset add allowed_macs "$mac" timeout "$TIMEOUT" -exist \
        || ERROR=1
    done <<< "$RESULT"
  fi

  # ---------------------------------
  # Handle success / failure
  # ---------------------------------
  if [[ "$ERROR" -eq 0 ]]; then
    echo "✅ ipset sync OK ($(date))"
    sleep 5
  else
    echo "⚠️ Error detected, retrying in ${RETRY_DELAY}s..."
    sleep "$RETRY_DELAY"
  fi
done
