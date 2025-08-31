#!/bin/bash

docker build -t the_bear .
docker run -p 1337:1337 the_bear