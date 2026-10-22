#!/usr/bin/env bash
#
# Rotates a MySQL password directly in the database (no Railway dashboard or redeploy needed),
# disconnects every other session, and puts the new DATABASE_URL on your clipboard.
#
# Run it once per database (QA, then Prod). Secrets are never printed: the current URL is read
# with hidden input, the new password is random, and the new URL goes to the clipboard only.
#
#   ./scripts/rotate-db-password.sh
#
set -euo pipefail

command -v mysql >/dev/null || { echo "mysql client not found (brew install mysql-client)"; exit 1; }
command -v pbcopy >/dev/null || { echo "pbcopy not found (this script expects macOS)"; exit 1; }

read -rsp "Current DATABASE_URL for this database (input hidden), or press Enter to type host/port/password instead: " OLD_URL
echo

if [ -z "$OLD_URL" ]; then
  # No URL handy (e.g. Railway only shows the private one): build it from the pieces
  read -rp "Public host (e.g. something.proxy.rlwy.net): " IN_HOST
  read -rp "Public port: " IN_PORT
  read -rp "User [root]: " IN_USER; IN_USER="${IN_USER:-root}"
  read -rp "Database name [railway]: " IN_DB; IN_DB="${IN_DB:-railway}"
  read -rsp "Current password (input hidden): " IN_PASS
  echo
  OLD_URL="$(IN_HOST="$IN_HOST" IN_PORT="$IN_PORT" IN_USER="$IN_USER" IN_DB="$IN_DB" IN_PASS="$IN_PASS" python3 - <<'PY'
import os, urllib.parse as u
q = lambda v: u.quote(v, safe="")
print(f"mysql://{q(os.environ['IN_USER'])}:{q(os.environ['IN_PASS'])}@{os.environ['IN_HOST']}:{os.environ['IN_PORT']}/{os.environ['IN_DB']}", end="")
PY
)"
fi

NEW_PASS="$(openssl rand -base64 64 | tr -dc 'A-Za-z0-9' | cut -c1-40)"
[ "${#NEW_PASS}" -eq 40 ] || { echo "Could not generate a password"; exit 1; }

# Split the URL into parts without printing anything
eval "$(OLD_URL="$OLD_URL" python3 - <<'PY'
import os, shlex, urllib.parse as u
p = u.urlparse(os.environ["OLD_URL"])
parts = {
    "DB_HOST": p.hostname or "",
    "DB_PORT": p.port or 3306,
    "DB_USER": u.unquote(p.username or ""),
    "OLD_PASS": u.unquote(p.password or ""),
    "DB_NAME": p.path.lstrip("/"),
}
for key, value in parts.items():
    print(f"{key}={shlex.quote(str(value))}")
PY
)"

sql() { # sql <password> <statement>
  MYSQL_PWD="$1" mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -N -B -e "$2"
}

echo "Connecting to ${DB_HOST}:${DB_PORT} as ${DB_USER}..."
ACCOUNT="$(sql "$OLD_PASS" "SELECT CURRENT_USER()")"   # e.g. root@%
ACCOUNT_USER="${ACCOUNT%@*}"
ACCOUNT_HOST="${ACCOUNT#*@}"

echo "Changing the password for ${ACCOUNT}..."
sql "$OLD_PASS" "ALTER USER '${ACCOUNT_USER}'@'${ACCOUNT_HOST}' IDENTIFIED BY '${NEW_PASS}'"

# Prove the switch worked in both directions
sql "$NEW_PASS" "SELECT 1" >/dev/null && echo "  new password works"
if sql "$OLD_PASS" "SELECT 1" >/dev/null 2>&1; then
  echo "  ERROR: the OLD password still works. Do not continue."; exit 1
else
  echo "  old password is rejected"
fi

# Changing a password does not drop sessions that are already open, so close every other one
echo "Closing every other open connection..."
KILLED=0
for id in $(sql "$NEW_PASS" "SELECT id FROM information_schema.processlist WHERE id <> CONNECTION_ID()"); do
  sql "$NEW_PASS" "KILL ${id}" >/dev/null 2>&1 && KILLED=$((KILLED + 1)) || true
done
echo "  closed ${KILLED} connection(s)"

echo
echo "Database accounts (anything you don't recognise should be investigated):"
sql "$NEW_PASS" "SELECT user, host FROM mysql.user ORDER BY user, host" | sed 's/^/  /'

# Same URL, new password, copied to the clipboard instead of printed
OLD_URL="$OLD_URL" NEW_PASS="$NEW_PASS" python3 - <<'PY' | pbcopy
import os
old, new = os.environ["OLD_URL"], os.environ["NEW_PASS"]
userinfo, rest = old.split("://", 1)[1].rsplit("@", 1)[0], old.rsplit("@", 1)[1]
user = userinfo.split(":", 1)[0]
print(f"{old.split('://', 1)[0]}://{user}:{new}@{rest}", end="")
PY

echo
echo "Done. The new DATABASE_URL is on your clipboard (it was not printed)."
echo "Paste it into the Vercel DATABASE_URL variable for this database, then redeploy."
echo "Until you do, the app can't reach this database."
