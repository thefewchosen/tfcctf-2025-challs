# ========== Build stage ==========
FROM node:20-bullseye AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
# Use ci if lockfile exists; otherwise install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build

# ========== Runtime stage ==========
FROM node:20-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-server supervisor openssh-client ca-certificates sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# ensure sshd runtime dir
RUN mkdir -p /var/run/sshd

# SQLite data dir
RUN mkdir -p /data

WORKDIR /app
COPY --from=builder /app /app

# Optionally include text files
COPY txts/ /tmp/txts/

# Setup SSH server + random user
RUN set -eux; \
    # Host keys
    ssh-keygen -A; \
    \
    # Random SSH user + flag
    USERNAME="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c32)"; \
    ADMIN_FLAG="TFCCTF{dum_dum_flag}"; \
    echo "Generated SSH user: ${USERNAME}"; \
    useradd -m -s /bin/bash "${USERNAME}"; \
    \
    # User SSH auth
    install -d -m 700 "/home/${USERNAME}/.ssh"; \
    ssh-keygen -t rsa -b 4096 -f /root/.ssh/id_rsa -N ""; \
    cat /root/.ssh/id_rsa.pub >> "/home/${USERNAME}/.ssh/authorized_keys"; \
    chown -R "${USERNAME}:${USERNAME}" "/home/${USERNAME}/.ssh"; \
    chmod 600 "/home/${USERNAME}/.ssh/authorized_keys"; \
    \
    # Seed /app with txts (if present)
    if [ -d /tmp/txts ]; then cp -a /tmp/txts/. "/app/" || true; fi; \
    \
    # ---------- DB_ID and SQLite DB ----------
    DB_ID="$(tr -dc 'a-f0-9' </dev/urandom | head -c32)"; \
    sqlite3 /app/users.db "PRAGMA journal_mode=WAL; \
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL); \
    INSERT INTO meta(key,value) VALUES('db_id','${DB_ID}') \
    ON CONFLICT(key) DO UPDATE SET value=excluded.value; \
    CREATE TABLE IF NOT EXISTS users ( \
    id INTEGER PRIMARY KEY AUTOINCREMENT, \
    username TEXT UNIQUE NOT NULL, \
    password TEXT NOT NULL, \
    admin INTEGER DEFAULT 0 \
    );"; \
    \
    # ---------- SSHD config ----------
    ssdc=/etc/ssh/sshd_config; \
    if grep -q '^PasswordAuthentication' "$ssdc"; then \
    sed -i 's/^PasswordAuthentication .*/PasswordAuthentication no/' "$ssdc"; \
    else echo 'PasswordAuthentication no' >> "$ssdc"; fi; \
    if grep -q '^PermitRootLogin' "$ssdc"; then \
    sed -i 's/^PermitRootLogin .*/PermitRootLogin no/' "$ssdc"; \
    else echo 'PermitRootLogin no' >> "$ssdc"; fi; \
    if grep -q '^PubkeyAuthentication' "$ssdc"; then \
    sed -i 's/^PubkeyAuthentication .*/PubkeyAuthentication yes/' "$ssdc"; \
    else echo 'PubkeyAuthentication yes' >> "$ssdc"; fi; \
    grep -q '^AuthorizedKeysFile' "$ssdc" || echo 'AuthorizedKeysFile .ssh/authorized_keys' >> "$ssdc"; \
    sed -i '/^[#[:space:]]*Subsystem[[:space:]]\+sftp/ d' "$ssdc"; \
    echo 'Subsystem sftp internal-sftp' >> "$ssdc"; \
    \
    echo "AllowUsers ${USERNAME}" >> "$ssdc"; \
    \
    # ---------- App env ----------
    { \
    echo "SSH_USERNAME=${USERNAME}"; \
    echo "ADMIN_FLAG=${ADMIN_FLAG}"; \
    echo "DB_ID=${DB_ID}"; \
    } > /app/.env.local

# Supervisor config
RUN mkdir -p /etc/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 22 3000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
