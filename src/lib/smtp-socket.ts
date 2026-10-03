import { connect } from 'cloudflare:sockets';
import { Duplex } from 'node:stream';
import type { Socket } from 'node:net';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// Use Cloudflare's native TLS socket; Nodemailer handles the SMTP protocol.
export const getSmtpSocket: NonNullable<SMTPTransport.Options['getSocket']> = (options, callback) => {
  const port = Number(options.port || 465);
  if (port !== 465) {
    callback(Object.assign(new Error('Implicit TLS port required'), { code: 'ECONFIG' }), {});
    return;
  }
  const socket = connect({ hostname: options.host!, port }, { secureTransport: 'on' });
  let finished = false;
  const openingTimeout = setTimeout(() => {
    if (finished) return;
    finished = true;
    void socket.close().catch(() => {});
    callback(Object.assign(new Error('SMTP connection timeout'), { code: 'ETIMEDOUT' }), {});
  }, 10000);
  void socket.closed.catch(() => {});
  void socket.opened.then(() => {
    if (finished) return;
    finished = true;
    clearTimeout(openingTimeout);
    const stream = Duplex.fromWeb({ readable: socket.readable, writable: socket.writable });
    let idleTimeout: ReturnType<typeof setTimeout> | undefined;
    let idleMs = 0;
    const resetTimeout = () => {
      clearTimeout(idleTimeout);
      if (idleMs > 0) idleTimeout = setTimeout(() => stream.emit('timeout'), idleMs);
    };
    const connection = Object.assign(stream, {
      setTimeout(ms: number) { idleMs = ms; resetTimeout(); return this; },
      setKeepAlive() { return this; },
    });
    stream.on('data', resetTimeout);
    stream.once('close', () => {
      clearTimeout(idleTimeout);
      void socket.close().catch(() => {});
    });
    // Nodemailer only uses Duplex I/O, setTimeout and setKeepAlive on a secured socket.
    callback(null, { connection: connection as unknown as Socket, secured: true });
  }).catch((error: Error) => {
    if (finished) return;
    finished = true;
    clearTimeout(openingTimeout);
    void socket.close().catch(() => {});
    callback(error, {});
  });
};
