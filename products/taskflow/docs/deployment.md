# TaskFlow Deployment Guide

## Local development

```bash
npm ci
npm run check
npm start
```

The server listens on `0.0.0.0:3000` by default. Set `PORT`, `HOST`, and `TASKFLOW_RUN_DIR` as needed.

## Docker

Build and run:

```bash
docker build -t taskflow-runtime:0.1.0 .
docker run --rm -p 3000:3000 \
  -v taskflow-runs:/app/.taskflow-runs \
  taskflow-runtime:0.1.0
```

The image runs as a non-root `taskflow` user. The volume preserves JSON run records across container replacement.

## Bare VPS

1. Install Node.js 22.
2. Copy the repository and run `npm ci` followed by `npm run build`.
3. Set `NODE_ENV=production`, `PORT`, and `TASKFLOW_RUN_DIR` in the service environment.
4. Run `node dist/src/server.js` under systemd or another process supervisor.
5. Terminate TLS at a reverse proxy.
6. Restrict filesystem permissions on the run directory.

Example systemd command:

```ini
ExecStart=/usr/bin/node /opt/taskflow/dist/src/server.js
WorkingDirectory=/opt/taskflow
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=TASKFLOW_RUN_DIR=/var/lib/taskflow/runs
```

## cloud deployment

Set the cloud deployment project root directory to `products/taskflow` when deploying from the monorepo. `api/run.ts` exports a Node-compatible `POST` handler.

The file-backed store is suitable only for local demonstration. Serverless production deployment must inject a durable external `RunStore`; ephemeral filesystems cannot be treated as durable run history.

## Production gate

Before real customer use, add:

- authentication and tenant-scoped authorization
- managed transactional persistence
- secret management
- request rate limits and workflow timeouts
- adapter allowlists and egress controls
- structured observability and alerting
- backup, retention, and deletion procedures
- load, failure-recovery, and security tests
