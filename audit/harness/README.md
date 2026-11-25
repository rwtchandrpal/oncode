# Local audit harness

Runs Oncode against throwaway local infrastructure. It never touches the Atlas, Redis Cloud
or Judge0 values in `backend/.env`.

| Piece | How |
|---|---|
| MongoDB 7 (single-node replica set, so transactions work like Atlas) | `docker run -d --name oncode-audit-mongo -p 127.0.0.1:27018:27017 mongo:7 --replSet rs0 --bind_ip_all`, then `rs.initiate` (see `start-backend.sh`) |
| Redis 7 with password | `docker run -d --name oncode-audit-redis -p 127.0.0.1:6380:6379 redis:7-alpine redis-server --requirepass auditpass` |
| Seed data | `node audit/harness/seed.js`: 3 local test accounts (credentials in that file) and 12 problems carrying `*_MARKER` strings for leak detection |
| Backend | `bash audit/harness/start-backend.sh`: port 3100, local-only `JWT_KEY`, Judge0 pointed at closed port 2359 |
| Frontend | `cd frontend && VITE_API_URL=http://localhost:3100 npx vite --port 5174 --strictPort` |

Tear down: `docker rm -f oncode-audit-mongo oncode-audit-redis`.
