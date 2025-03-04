#!/bin/bash

# Load environment variables from .env.local
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# MySQL credentials
DB_HOST="$DB_HOST"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"
DB_NAME="$DB_NAME"

# Query the database
query="SELECT mac, expire_on, paused FROM clients WHERE expire_on >= NOW();"
result=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -sN -e "$query")

# Iterate over each row
while IFS=$'\t' read -r mac expire_on paused; do
    if [ "$paused" -eq 0 ]; then
        # Convert timestamps to seconds difference
        expire_timestamp=$(date -d "$expire_on" +%s)
        now_timestamp=$(date +%s)
        timeout=$((expire_timestamp - now_timestamp))

        # Limit timeout to 2147483 if it exceeds
        [ "$timeout" -ge 2147483 ] && timeout=2147483
        echo "$timeout"

        # Execute ipset command
        ipset add allowed_macs "$mac" timeout "$timeout" -exist
    fi
done <<< "$result"

echo "Processed clients."
