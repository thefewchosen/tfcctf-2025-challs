#!/bin/bash

docker build -t icseses .
docker run -it --rm \
    -p 8000:8000 \
    icseses