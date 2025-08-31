#!/bin/sh

qemu-system-x86_64 \
  -kernel ./bzImage \
  -cpu max \
  -initrd ./initramfs.cpio.gz \
  -nographic \
  -monitor none,server,nowait,nodelay,reconnect=-1 \
  -serial stdio  \
  -display none \
  -m 256M \
  -no-reboot \
  -nographic \
  -append "console=ttyS0 kpti fgkaslr quiet"