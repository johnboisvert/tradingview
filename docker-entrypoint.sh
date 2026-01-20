#!/bin/sh
set -e

echo "ENTRYPOINT OK - PORT=$PORT"
echo "CMD: $@"

exec "$@"
