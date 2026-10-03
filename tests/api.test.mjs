import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

test('Pages Function rejects unsafe requests and reports unconfigured delivery honestly', async (t) => {
  const runtime = new Miniflare(convertV4MiniflareOptions({ name: 'contact-tests',
    modules: true,
    scriptPath: fileURLToPath(new URL('../.wrangler/functions-build/index.js', import.meta.url)),
    compatibilityDate: '2026-09-27',
    compatibilityFlags: ['nodejs_compat'],
    bindings: { SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '' },
    serviceBindings: { ASSETS: () => new Response('Not found', { status: 404 }) },
  }));
  t.after(() => runtime.dispose());
  const url = 'https://buscamostutrastero.com/api/contacto';
  assert.equal((await runtime.dispatchFetch(url)).status, 405);
  const input = { firstName: 'Prueba', lastName: 'Interna', email: 'prueba@example.com', phone: '+34 600 000 000', size: '1,5', consent: 'yes' };
  const send = (body, options = {}) => runtime.dispatchFetch(url, {
    method: 'POST', body,
    headers: { Origin: 'https://buscamostutrastero.com', Accept: 'application/json', 'Content-Type': 'application/json', ...options },
  });
  assert.equal((await send(JSON.stringify(input), { Origin: 'https://other.example.com' })).status, 403);
  assert.equal((await send(JSON.stringify({ ...input, need: 'x'.repeat(18000) }))).status, 413);
  const unconfigured = await send(JSON.stringify(input));
  assert.equal(unconfigured.status, 503);
  assert.equal(unconfigured.headers.get('cache-control'), 'no-store');
  assert.equal(unconfigured.headers.get('x-robots-tag'), 'noindex');
  assert.equal((await unconfigured.json()).ok, false);
  const invalid = await send(JSON.stringify({ ...input, consent: '' }));
  assert.equal(invalid.status, 422);
  assert.ok((await invalid.json()).errors.consent);
  const native = await send(new URLSearchParams(input).toString(), { Accept: 'text/html', 'Content-Type': 'application/x-www-form-urlencoded' });
  assert.equal(native.status, 503);
  assert.ok(native.headers.get('content-type').includes('text/html'));
  assert.ok((await native.text()).includes('No se ha podido enviar la consulta.'));
  assert.equal((await send('{invalid')).status, 400);
  assert.equal((await send(JSON.stringify(input))).status, 503);
  assert.equal((await send(JSON.stringify(input))).status, 429);
});
