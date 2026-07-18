import { handleRequest } from '../src/http/handler.js';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  url.pathname = '/v1/runs/client-intake';
  return handleRequest(new Request(url, request));
}
