FROM node:24-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive
# Chromium version not related to the challenge, this is the latest at the time of challenge creation
ARG CHROMIUM_PKG_VERSION="139.0.7258.138-1~deb12u1"
ARG SNAPSHOT_TS="20250820T000000Z"

RUN set -eux; \
  printf 'Acquire::Check-Valid-Until "false";\n' > /etc/apt/apt.conf.d/99no-check-valid-until; \
  cat > /etc/apt/sources.list <<EOF
deb http://snapshot.debian.org/archive/debian/${SNAPSHOT_TS} bookworm main
deb http://snapshot.debian.org/archive/debian/${SNAPSHOT_TS} bookworm-updates main
deb http://snapshot.debian.org/archive/debian-security/${SNAPSHOT_TS} bookworm-security main
EOF

# System deps Chrome needs at runtime (minimal but practical set)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl wget build-essential python3 \
    # common Chrome runtime libs
    libnss3 libnspr4 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 \
    libxext6 libxfixes3 libxrandr2 libxrender1 libxi6 libxss1 libatk-bridge2.0-0 \
    libgtk-3-0 libdrm2 libgbm1 libasound2 libpangocairo-1.0-0 libpango-1.0-0 libcairo2 \
    fonts-liberation \
    chromium=${CHROMIUM_PKG_VERSION} \
  && rm -rf /var/lib/apt/lists/*

# Chromedriver setup
COPY bin/chromedriver /usr/bin/chromedriver

# CTF setup
COPY flag.txt /root/flag.txt

WORKDIR /tmp
COPY read_flag.c .
RUN gcc read_flag.c -o /usr/bin/read_flag
RUN chown root:root /usr/bin/read_flag && chmod 4755 /usr/bin/read_flag

# App setup
RUN useradd -m -u 10001 app

WORKDIR /app
RUN chown app:app /app

COPY src/package*.json ./
RUN npm install

# Copy app
COPY src/ .

# Drop privileges for the Node app
USER app

# Run the Express server
EXPOSE 3000
CMD ["node", "app.js"]
