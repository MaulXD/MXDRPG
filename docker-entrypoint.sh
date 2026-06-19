#!/bin/sh
set -e

# Cache gravável — K8s pode montar .next sem permissão de escrita
RUNTIME_CACHE="/tmp/mxdrpg-next-cache"
mkdir -p "${RUNTIME_CACHE}/images" "${RUNTIME_CACHE}/fetch-cache"

mkdir -p /app/.next 2>/dev/null || true
if [ -e /app/.next/cache ] && [ ! -L /app/.next/cache ]; then
  rm -rf /app/.next/cache 2>/dev/null || true
fi
ln -sfn "${RUNTIME_CACHE}" /app/.next/cache

exec "$@"
