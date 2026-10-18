import test from 'node:test';
import assert from 'node:assert/strict';
import { consentKey, consentLifetime, createAnalyticsConsent, measurementId } from '../src/lib/analytics-consent.mjs';

function fixture(saved = null) {
  let value = saved;
  let time = 1800000000000;
  const commands = [];
  const loads = [];
  const disabled = [];
  const cleared = [];
  const consent = createAnalyticsConsent({
    storage: { getItem: () => value, setItem: (key, next) => { assert.equal(key, consentKey); value = next; } },
    now: () => time,
    command: (...args) => commands.push(args), loadTag: () => loads.push(true),
    disable: (next) => disabled.push(next), clearCookies: () => cleared.push(true),
    page: { location: 'https://www.buscamostutrastero.com/contacto/', referrer: '', title: 'Contacto' },
  });
  return { consent, commands, loads, disabled, cleared, advance: () => { time += consentLifetime; }, value: () => value };
}

test('unknown, rejected, malformed, future and expired preferences never load Google', () => {
  for (const saved of [null, '{bad', JSON.stringify({ version: 1, analytics: true, savedAt: 1800000000001 }), JSON.stringify({ version: 1, analytics: true, savedAt: 1800000000000 - consentLifetime })]) {
    const f = fixture(saved);
    assert.equal(f.consent.sync(), null);
    f.consent.lead();
    f.consent.choose(false);
    assert.equal(f.consent.sync(), false);
    assert.deepEqual(f.loads, []);
    assert.deepEqual(f.commands, []);
    assert.equal(f.disabled.at(-1), true);
  }
});

test('acceptance loads once, keeps advertising denied and sends only an anonymous success event', () => {
  const f = fixture();
  f.consent.sync();
  f.consent.lead();
  f.consent.choose(true);
  f.consent.sync();
  f.consent.lead();
  assert.equal(f.loads.length, 1);
  assert.equal(f.commands.filter(([type]) => type === 'config').length, 1);
  assert.deepEqual(f.commands[0], ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }]);
  assert.deepEqual(f.commands.at(-1), ['event', 'generate_lead', { send_to: measurementId }]);
  const config = f.commands.find(([type]) => type === 'config')[2];
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.cookie_update, false);
});

test('withdrawal stops leads, clears cookies and supports accepting again without a second script', () => {
  const f = fixture();
  f.consent.choose(true);
  f.consent.choose(false);
  const count = f.commands.length;
  f.consent.lead();
  assert.equal(f.commands.length, count);
  assert.equal(f.disabled.at(-1), true);
  assert.ok(f.cleared.length);
  f.consent.choose(true);
  f.consent.lead();
  assert.equal(f.loads.length, 1);
  assert.equal(f.commands.filter(([type]) => type === 'config').length, 2);
  f.advance();
  f.consent.lead();
  assert.equal(f.consent.sync(), null);
  assert.equal(f.disabled.at(-1), true);
});

test('blocked browser storage does not break consent or enable tracking by default', () => {
  const loads = [];
  const consent = createAnalyticsConsent({
    storage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } },
    command() {}, disable() {}, clearCookies() {}, loadTag: () => loads.push(true),
    page: { location: '', referrer: '', title: '' },
  });
  assert.equal(consent.sync(), null);
  assert.equal(loads.length, 0);
  consent.choose(true);
  assert.equal(loads.length, 1);
});
