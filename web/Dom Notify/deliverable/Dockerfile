FROM node:22-bookworm
RUN apt update && apt install -y chromium

WORKDIR /app

COPY src/package*.json ./
RUN npm install

COPY src/ .

EXPOSE 3000

ENV FLAG=TFCCTF{F4k3_flAg}

CMD ["npm", "start"]