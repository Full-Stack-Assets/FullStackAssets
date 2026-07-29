import { resolve } from 'node:path';
import { createClientIntakeWorkflow } from '../workflows/client-intake.js';
import { runWorkflow } from '../core/engine.js';
import { JsonFileRunStore } from '../core/persistence.js';
import type {
  RunStore,
  RuntimeClock,
} from '../core/types.js';

export interface HttpHandlerDependencies {
  store?: RunStore;
  clock?: RuntimeClock;
  idFactory?: () => string;
}

const MAX_BODY_BYTES = 1_000_000;

function json(value: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(`${JSON.stringify(value)}\n`, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

function defaultStore(): RunStore {
  const directory = process.env.TASKFLOW_RUN_DIR ?? resolve('.taskflow-runs');
  return new JsonFileRunStore(directory);
}

export async function handleRequest(
  request: Request,
  dependencies: HttpHandlerDependencies = {},
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/health') {
    return json({
      status: 'ok',
      product: 'TaskFlow Runtime',
      studio: 'planned',
    });
  }

  if (url.pathname !== '/v1/runs/client-intake') {
    return json({ error: 'Route not found.' }, 404);
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405, { allow: 'POST' });
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Request body exceeds 1 MB.' }, 413);
  }

  let input: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return json({ error: 'Request body exceeds 1 MB.' }, 413);
    }
    input = JSON.parse(raw);
  } catch {
    return json({ error: 'Request body must contain valid JSON.' }, 400);
  }

  const runtimeDependencies = {
    store: dependencies.store ?? defaultStore(),
    ...(dependencies.clock ? { clock: dependencies.clock } : {}),
    ...(dependencies.idFactory ? { idFactory: dependencies.idFactory } : {}),
  };
  const record = await runWorkflow(
    createClientIntakeWorkflow(),
    input as Parameters<ReturnType<typeof createClientIntakeWorkflow>['plan']>[0],
    runtimeDependencies,
  );

  return json(record, record.status === 'succeeded' ? 200 : 422);
}
