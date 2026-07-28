#!/usr/bin/env bash

set -e

set -a
source .env.dev
set +a

exec "$@"