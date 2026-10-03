import nodemailer from 'nodemailer';
import { business } from '../../src/lib/business';
import { storageSizes } from '../../src/lib/storage-content';
import { submitInquiry } from '../../src/lib/inquiry.mjs';

interface Env {
  SMTP_HOST?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_PORT?: string;
}
const attempts = new Map<string, { count: number; expires: number }>();
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export const onRequest = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  const clientAddress = request.headers.get('CF-Connecting-IP') || 'local';
  const asJson = request.headers.get('accept')?.includes('application/json');
  const respond = (status: number, body: { ok: boolean; message: string; errors?: Record<string, string> }) => {
    const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
    if (asJson) return Response.json(body, { status, headers });
    const errors = body.errors ? Object.values(body.errors).map((message) => `<li>${escape(message)}</li>`).join('') : '';
    return new Response(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Consulta · Buscamos tu Trastero</title><link rel="stylesheet" href="/contact-response.css"><main><h1>${body.ok ? 'Tu consulta se ha enviado.' : 'No se ha podido enviar la consulta.'}</h1><p>${escape(body.message)}</p>${errors ? `<ul>${errors}</ul>` : ''}<p>${body.ok ? 'Nos pondremos en contacto contigo. No has hecho una reserva ni un pago.' : 'Vuelve atrás en tu navegador para revisar los datos o escribe a nuestro correo.'}</p><a href="${body.ok ? '/' : '/contacto/'}">${body.ok ? 'Volver a la web' : 'Ir al formulario'}</a><p><a href="mailto:${business.email}">${business.email}</a></p></main></html>`, { status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
  };
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(requestUrl.hostname);
  const preview = /^(?:[a-z0-9-]+\.)?landing-br9\.pages\.dev$/.test(requestUrl.hostname);
  const publicOrigins = [business.url, `https://www.${new URL(business.url).hostname}`];
  if (!publicOrigins.includes(origin ?? '') && !((local || preview) && origin === requestUrl.origin)) return respond(403, { ok: false, message: 'Envía tu consulta desde el formulario de nuestra web.' });
  if (Number(request.headers.get('content-length')) > 16384) return respond(413, { ok: false, message: 'La consulta es demasiado larga. Reduce la descripción e inténtalo de nuevo.' });
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
  const entry = attempts.get(clientAddress);
  if ((entry && entry.count >= 5) || (!entry && attempts.size >= 2000)) return respond(429, { ok: false, message: 'Hay demasiados intentos de envío. Espera unos minutos o contacta por correo.' });
  attempts.set(clientAddress, { count: (entry?.count ?? 0) + 1, expires: entry?.expires ?? now + 600000 });
  let input: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return respond(400, { ok: false, message: 'La consulta no contiene datos.' });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 16384) { await reader.cancel(); return respond(413, { ok: false, message: 'La consulta es demasiado larga. Reduce la descripción e inténtalo de nuevo.' }); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const raw = new TextDecoder().decode(bytes);
    const contentType = request.headers.get('content-type')?.split(';')[0];
    if (contentType === 'application/json') input = JSON.parse(raw);
    else if (contentType === 'application/x-www-form-urlencoded') input = Object.fromEntries(new URLSearchParams(raw));
    else return respond(415, { ok: false, message: 'Utiliza el formulario de consulta de nuestra web.' });
  } catch { return respond(400, { ok: false, message: 'No se han podido leer los datos. Revisa la consulta e inténtalo de nuevo.' }); }
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass, SMTP_PORT: portValue } = env;
  const port = Number(portValue || 465);
  const configured = host && user === business.email && pass && [465, 587].includes(port);
  const transport = configured ? nodemailer.createTransport({ host, port, secure: port === 465, requireTLS: true, auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 }) : null;
  const result = await submitInquiry(input, {
    recipient: business.email,
    sizes: storageSizes.map(({ size }) => size),
    sendMail: transport ? (message: Parameters<typeof transport.sendMail>[0]) => transport.sendMail(message) : null,
  });
  transport?.close();
  return respond(result.status, result.body);
};
