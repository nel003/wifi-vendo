#!/bin/bash

RETRY_DELAY=5

while true; do
  ERROR=0

  # ---------------------------------
  # Resolve .env.local from script dir
  # ---------------------------------
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  ENV_FILE="$SCRIPT_DIR/.env.local"

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ ENV file not found: $ENV_FILE"
    ERROR=1
  else
    export $(grep -v '^#' "$ENV_FILE" | xargs)
  fi

  # ---------------------------------
  # Validate required variables
  # ---------------------------------
  for v in DB_HOST DB_USER DB_PASSWORD DB_NAME; do
    if [[ -z "${!v}" ]]; then
      echo "❌ Missing env: $v"
      ERROR=1
    fi
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

      EXPIRE_TIMESTAMP=$(date -d "$expire_on" +%s) || {
        ERROR=1
        break
      }

      TIMEOUT=$((EXPIRE_TIMESTAMP - NOW_TIMESTAMP))

      [[ "$TIMEOUT" -le 0 ]] && continue
      [[ "$TIMEOUT" -gt 2147483 ]] && TIMEOUT=2147483

      ipset add allowed_macs "$mac" timeout "$TIMEOUT" -exist || {
        ERROR=1
        break
      }
    done <<< "$RESULT"
  fi

  # ---------------------------------
  # SUCCESS / RETRY LOGIC
  # ---------------------------------
  if [[ "$ERROR" -eq 0 ]]; then
    echo "✅ ipset sync successful — exiting"
    exit 0
  else
    echo "⚠️ Error occurred — retrying in ${RETRY_DELAY}s..."
    sleep "$RETRY_DELAY"
  fi
done
