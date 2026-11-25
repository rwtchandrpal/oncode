#!/usr/bin/env bash
# Starts the Oncode backend against DISPOSABLE local containers only.
# Process env vars take precedence over backend/.env (dotenv does not override),
# so the production Atlas / Redis Cloud / Judge0 values in .env are never used.
#
# Prereqs (see README.md):
#   docker run -d --name oncode-audit-mongo -p 127.0.0.1:27018:27017 mongo:7 --replSet rs0 --bind_ip_all
#   docker exec oncode-audit-mongo mongosh --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
#   docker run -d --name oncode-audit-redis -p 127.0.0.1:6380:6379 redis:7-alpine redis-server --requirepass auditpass
set -euo pipefail
cd "$(dirname "$0")/../../backend"

export PORT=3100
export MONGO_URI="mongodb://127.0.0.1:27018/oncode_audit?replicaSet=rs0&directConnection=true"
export REDIS_HOST=127.0.0.1
export REDIS_PORT=6380
export REDIS_PASS=auditpass
export JWT_KEY="local-audit-only-key-not-a-secret-0123456789abcdef"
# Judge0 is intentionally offline: point at a closed local port (fast ECONNREFUSED)
export JUDGE0_BASE_URL="http://127.0.0.1:2359"
export JUDGE0_AUTH_TOKEN="local-dummy"
export CLIENT_URL="http://localhost:5174"
# GEMINI_API_KEY is deliberately NOT overridden (comes from backend/.env) so the AI tutor can be smoke-tested.

exec node src/server.js
