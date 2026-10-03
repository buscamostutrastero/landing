import type { APIRoute } from 'astro';
import { getBusinessMarkdown } from '../lib/llms-content';

export const prerender = true;
export const GET: APIRoute = () => new Response(getBusinessMarkdown(), {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});
