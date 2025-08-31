FROM python:3.9-slim

# avoid prompts and keep image lean
ENV DEBIAN_FRONTEND=noninteractive

# install Chromium, Chromedriver and needed libs
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

# so selenium can call "google-chrome" by default
RUN ln -s /usr/bin/chromium /usr/bin/google-chrome

RUN useradd -m -d /app -s /bin/bash sadge \
    && chown -R sadge:sadge /app
USER sadge

WORKDIR /app
COPY . /app

# install Python deps
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

# tell Selenium where to find Chromium if needed:
ENV CHROME_BINARY=/usr/bin/chromium

CMD ["python", "main.py"]