FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
 && apt-get install -y --no-install-recommends bash socat \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY yo_mama .
COPY flag.txt /tmp/flag.txt
RUN random_file=$(mktemp /flag.XXXXXX) && mv /tmp/flag.txt "$random_file"

RUN chmod +x yo_mama

ENTRYPOINT ["socat", "TCP-LISTEN:4444,reuseaddr,fork", "EXEC:./yo_mama yooooooo_mama_test,pty,stderr"]
