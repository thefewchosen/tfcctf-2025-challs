FROM python:3.14.0rc2-bookworm

COPY ./jail.py /jail.py
COPY ./flag.txt /flag.txt

RUN apt update; apt  install -y socat; rm -rf /var/lib/apt/lists/*

RUN chmod 700 /flag.txt
RUN chmod 755 /jail.py

EXPOSE 1337

CMD ["socat", "TCP-LISTEN:1337,reuseaddr,fork", "EXEC:python3 /jail.py"]
