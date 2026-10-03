import type { APIRoute } from 'astro';
import { getLlmsIndex } from '../lib/llms-content';

export const prerender = true;
export const GET: APIRoute = () => new Response(getLlmsIndex(), {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
