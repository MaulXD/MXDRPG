#!/bin/sh
set -e

# Next.js image optimizer (and other caches) need a writable tree at runtime.
mkdir -p /app/.next/cache/images /app/.next/cache/fetch-cache

exec "$@"
