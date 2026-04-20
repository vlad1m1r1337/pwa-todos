#!/usr/bin/env bash
# Build script for Render. Runs during deploy: installs deps and collects static.
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
