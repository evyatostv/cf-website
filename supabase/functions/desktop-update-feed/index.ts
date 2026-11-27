import { createUpdateFeed } from './feed.ts';

Deno.serve(createUpdateFeed({ env: Deno.env.get, request: fetch, now: Date.now }));
