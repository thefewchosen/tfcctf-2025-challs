FROM debian:bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    socat \
    libglib2.0-0 \
    libpixman-1-0 \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd -r ctf && useradd -r -g ctf -d /home/ctf -m -s /usr/sbin/nologin ctf

WORKDIR /app
COPY qemu /app/qemu
COPY crorex /app

COPY flag.txt /tmp/flag.txt
RUN random_file=$(mktemp /flag.XXXXXX) && mv /tmp/flag.txt "$random_file" && chown -R root:root "$random_file" && chmod 744 "$random_file"


RUN chmod +x /app/qemu || true \
 && chmod +x /app/crorex   || true

USER ctf:ctf

EXPOSE 1337/tcp


CMD ["socat","-d","-d","-x","TCP-LISTEN:1337,reuseaddr,fork","EXEC:env -i ./qemu ./crorex,stderr,setsid"]
