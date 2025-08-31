FROM debian:bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive

# Tools needed to serve the binary over TCP, plus common qemu deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    socat \
    libglib2.0-0 \
    libpixman-1-0 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY qemu /app
COPY mucusuki /app

COPY flag.txt /tmp/flag.txt
RUN random_file=$(mktemp /flag.XXXXXX) && mv /tmp/flag.txt "$random_file"

# Make sure your two executables are runnable (ignore if already +x)
RUN chmod +x /app/qemu || true \
 && chmod +x /app/mucusuki   || true

EXPOSE 1337/tcp

# Serve the program on port 1337, with a clean environment (env -i)
# pty/sane options make interactive TTY-like I/O behave nicely
CMD ["sh", "-c", "exec socat TCP-LISTEN:1337,reuseaddr,fork,backlog=128 EXEC:'env -i ./qemu ./mucusuki',pty,echo=0,stderr,setsid,sigint,sane"]
