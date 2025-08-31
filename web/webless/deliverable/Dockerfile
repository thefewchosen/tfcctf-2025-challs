FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg ca-certificates \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-linux-signing-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y --no-install-recommends \
       google-chrome-stable fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

COPY ./templates /app/templates
COPY ./bot.py /app/bot.py
COPY ./server.py /app/server.py

RUN useradd -m ctf && chown -R ctf:ctf /app
USER ctf

# Environment (FLAG injected at run time)
ENV FLASK_RUN_HOST=0.0.0.0 \
    PORT=5000 \
    FLAG=TFCCTF{DUMMY}

EXPOSE 5000

# Default command: run the Flask server (bot runs in-process via /bot route)
WORKDIR /app
CMD ["python", "server.py"]
