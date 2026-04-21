#!/bin/sh
# API + crawler in one container (Render free tier: no separate Background Worker).
set -e
node dist/crawler.main.js &
exec node dist/main.js
