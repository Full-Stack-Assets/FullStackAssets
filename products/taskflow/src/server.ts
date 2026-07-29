import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { handleRequest } from './http/handler.js';

const MAX_BODY_BYTES = 1_000_000;
const port = Number(process.env.PORT ?? '3000');
const host = process.env.HOST ?? '0.0.0.0';

const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of incoming) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_BODY_BYTES) {
        outgoing.writeHead(413, { 'content-type': 'application/json; charset=utf-8' });
        outgoing.end('{"error":"Request body exceeds 1 MB."}\n');
        return;
      }
      chunks.push(buffer);
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(name, item);
      } else if (value !== undefined) {
        headers.set(name, value);
      }
    }

    const requestUrl = new URL(incoming.url ?? '/', `http://${incoming.headers.host ?? `${host}:${port}`}`);
    const method = incoming.method ?? 'GET';
    const requestInit: RequestInit = { method, headers };
    if (method !== 'GET' && method !== 'HEAD') {
      requestInit.body = Buffer.concat(chunks);
    }

    const response = await handleRequest(new Request(requestUrl, requestInit));
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    outgoing.writeHead(response.status, responseHeaders);
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outgoing.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
    outgoing.end(`${JSON.stringify({ error: message })}\n`);
  }
});

server.listen(port, host, () => {
  process.stdout.write(`TaskFlow Runtime listening on http://${host}:${port}\n`);
  process.stdout.write(`Run storage: ${process.env.TASKFLOW_RUN_DIR ?? resolve('.taskflow-runs')}\n`);
});
