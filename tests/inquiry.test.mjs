import test from 'node:test';
import assert from 'node:assert/strict';
import { submitInquiry } from '../src/lib/inquiry.mjs';

const recipient = 'contacto@buscamostutrastero.com';
const sizes = ['1', '1,5', '2', '2,5', '3', '3,5'];
const input = { firstName: 'Prueba', lastName: 'Formulario', phone: '+34 600 000 000', email: 'prueba@example.com', address: '', postalCode: '', need: 'Datos ficticios. Prueba interna.', size: 'unknown', consent: 'yes' };

test('valid enquiry reaches only the business mailbox, with visitor as reply-to', async () => {
  let message;
  const result = await submitInquiry(input, { sizes, recipient, sendMail: async (mail) => { message = mail; return { accepted: [recipient] }; } });
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(message.to, recipient);
  assert.equal(message.from.address, recipient);
  assert.equal(message.replyTo.address, input.email);
  assert.ok(message.text.includes('Necesita ayuda para elegir'));
  assert.ok(message.text.includes('No indicada'));
  assert.ok(message.text.includes(input.need));
});

test('all six advertised sizes can be sent', async () => {
  for (const size of sizes) {
    const result = await submitInquiry({ ...input, size }, { sizes, recipient, sendMail: async (mail) => {
      assert.ok(mail.text.includes(`Tamaño: ${size} m²`));
      return { accepted: [recipient] };
    } });
    assert.equal(result.status, 200);
  }
});

test('invalid fields, consent, honeypot and header injection never send email', async () => {
  const cases = [
    { firstName: '' }, { lastName: '' }, { phone: '123' }, { email: 'invalido' },
    { email: 'user@example.com\r\nBcc: stranger@example.com' }, { firstName: 'Name\nBcc: other' },
    { postalCode: '1234' }, { size: '100' }, { consent: '' }, { website: 'bot' },
    { need: 'x'.repeat(2001) }, { email: ['a@example.com'] },
  ];
  for (const invalid of cases) {
    const result = await submitInquiry({ ...input, ...invalid }, { sizes, recipient, sendMail: () => assert.fail('Invalid enquiry must never send') });
    assert.equal(result.status, 422);
    assert.equal(result.body.ok, false);
  }
  const result = await submitInquiry(null, { sizes, recipient, sendMail: () => assert.fail('Malformed enquiry must never send') });
  assert.equal(result.status, 422);
});

test('missing configuration, SMTP failure and recipient rejection never claim success', async () => {
  const unconfigured = await submitInquiry(input, { sizes, recipient, sendMail: null });
  assert.equal(unconfigured.status, 503);
  for (const sendMail of [async () => { throw new Error('SMTP denied'); }, async () => ({ accepted: [] }), async () => ({ accepted: ['other@example.com'] })]) {
    const result = await submitInquiry(input, { sizes, recipient, sendMail });
    assert.equal(result.status, 502);
    assert.equal(result.body.ok, false);
  }
});
