FROM python:3.11-alpine

# Install socat
RUN apk add --no-cache socat

# Create non-root user
RUN addgroup -S ctf && adduser -S -G ctf -H ctf

WORKDIR /app
COPY challenge.py /app/challenge.py
COPY secret_stuff.py /app/secret_stuff.py

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=1337

RUN chown -R ctf:ctf /app
USER ctf

EXPOSE 1337

# Use socat to listen and exec the python server
CMD [ "sh", "-c", "exec socat -T60 TCP-LISTEN:${PORT},fork,reuseaddr,keepalive,bind=0.0.0.0 EXEC:'python3 -u /app/challenge.py',stderr,setsid,sigint" ]