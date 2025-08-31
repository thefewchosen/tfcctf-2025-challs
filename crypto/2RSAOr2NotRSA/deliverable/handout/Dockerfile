FROM ubuntu:24.04 AS build

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get -y update && apt-get install -y \
    autoconf \
    bison \
    flex \
    gcc \
    g++ \
    git \
    libprotobuf-dev \
    libnl-route-3-dev \
    libtool \
    make \
    pkg-config \
    protobuf-compiler
RUN git clone https://github.com/google/nsjail.git /nsjail && cd /nsjail && make

FROM ubuntu:24.04

# Install nsjail and a tiny PID1 to handle signals/zombies
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init ca-certificates libprotobuf-dev libnl-route-3-dev && \
    rm -rf /var/lib/apt/lists/*

# Create unprivileged user
RUN useradd -u 10001 -m -s /usr/sbin/nologin ctf
COPY --from=build /nsjail/nsjail /usr/bin/nsjail

# App directory
WORKDIR /app

# Copy your server binary (build it statically if you can)
# Ensure it's owned by ctf and not writable
COPY server /app/server
RUN chown ctf:ctf /app/server && chmod 0500 /app/server

# Entrypoint script that restarts on crash
COPY entrypoint.sh /entrypoint.sh
COPY flag.txt /app/flag.txt
RUN chmod +x /entrypoint.sh
RUN chmod +x /app/server

EXPOSE 1337/tcp

ENTRYPOINT ["/usr/bin/dumb-init","--"]
ENV PORT=1337
CMD ["/entrypoint.sh"]