#!/bin/sh
set -e

# Cache gravável — K8s pode montar .next sem subpasta cache
RUNTIME_CACHE="/tmp/mxdrpg-next-cache"
mkdir -p "${RUNTIME_CACHE}/images" "${RUNTIME_CACHE}/fetch-cache"

mkdir -p /app/.next 2>/dev/null || true
if mkdir -p /app/.next/cache/images /app/.next/cache/fetch-cache 2>/dev/null; then
  : # ok — usa .next/cache do container
else
  rm -rf /app/.next/cache 2>/dev/null || true
  ln -sfn "${RUNTIME_CACHE}" /app/.next/cache
fi

exec "$@"
