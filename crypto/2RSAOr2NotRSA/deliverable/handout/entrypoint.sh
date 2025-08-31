#!/bin/sh
set -eu

export GLIBC_TUNABLES="glibc.malloc.tcache_count=0"

while true; do
  echo "[nsjail] starting server…" >&2
  /usr/bin/nsjail \
    --quiet \
    --user ctf --group ctf \
    --cwd /app \
  --disable_clone_newnet \
  --disable_clone_newns \
  --disable_clone_newcgroup \
  --disable_clone_newuts \
  --disable_clone_newipc \
  --disable_clone_newuser \
  --disable_clone_newpid \
  --env GLIBC_TUNABLES=glibc.malloc.tcache_count=0 \
    --max_cpus 1 \
    --rlimit_as 1024 \
    --rlimit_nproc 256 \
    --rlimit_nofile 1024 \
    --time_limit 0 \
    -- \
  /app/server || true

  code=$?
  echo "[nsjail] server exited (code $code), restarting in 1s…" >&2
  sleep 1
done