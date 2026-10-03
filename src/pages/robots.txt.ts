import type { APIRoute } from 'astro';
import { business } from '../lib/business';

export const prerender = true;
export const GET: APIRoute = () => new Response(
  `User-agent: *\nAllow: /\n\nSitemap: ${business.url}/sitemap-index.xml\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
