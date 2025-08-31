#!/bin/bash

docker build -t rsa_inv .
exec docker run --rm \
	--name rsa_inv \
	-p 1337:1337 \
	--cap-add=SYS_ADMIN \
	--cap-add=SYS_CHROOT \
	--security-opt seccomp=unconfined \
	--security-opt apparmor=unconfined \
	-e FLAG="$(cat flag.txt 2>/dev/null || echo TFCCTF{dummy_flag})" \
	rsa_inv
