import { connect as connectTcp } from 'node:net';
import { connect as connectTls } from 'node:tls';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// Preserve the hostname in Cloudflare's socket API for TLS certificate matching.
// Nodemailer's default connector first replaces the hostname with a resolved IP.
export const getSmtpSocket: NonNullable<SMTPTransport.Options['getSocket']> = (options, callback) => {
  const host = options.host!;
  const port = Number(options.port || 465);
  const secure = port === 465;
  const socket = secure
    ? connectTls({ host, port, servername: host, rejectUnauthorized: true })
    : connectTcp({ host, port });
  let finished = false;
  const finish = (error: Error | null) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    socket.removeListener('error', onError);
    if (error) {
      socket.destroy();
      callback(error, {});
    } else callback(null, { connection: socket, secured: secure });
  };
  const onError = (error: Error) => finish(error);
  const timer = setTimeout(() => finish(Object.assign(new Error('SMTP connection timeout'), { code: 'ETIMEDOUT' })), 10000);
  socket.once('error', onError);
  socket.once(secure ? 'secureConnect' : 'connect', () => finish(null));
};
