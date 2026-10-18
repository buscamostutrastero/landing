import { consentKey, createAnalyticsConsent, measurementId } from '../lib/analytics-consent.mjs';

const banner = document.querySelector<HTMLElement>('#cookie-consent')!;
const heading = banner.querySelector<HTMLElement>('h2')!;
const close = banner.querySelector<HTMLButtonElement>('[data-cookie-close]')!;
const analyticsWindow = window as unknown as Record<string, unknown>;
const queue: unknown[] = [];
analyticsWindow.dataLayer = queue;
// gtag expects an Arguments object for each queued command.
const command = function (..._args: unknown[]) { queue.push(arguments); };
analyticsWindow.gtag = command;
let returnFocus: HTMLElement | null = null;
let hasChoice = false;

const clearCookies = () => {
  const domains = ['', location.hostname, `.${location.hostname}`, '.buscamostutrastero.com'];
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (!/^_ga(?:_|$)/.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
    }
  }
};
let storage: Pick<Storage, 'getItem' | 'setItem'>;
try { storage = window.localStorage; }
catch { storage = { getItem: () => null, setItem: () => {} }; }
const consent = createAnalyticsConsent({
  storage, command,
  page: {
    location: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href,
    referrer: document.referrer ? new URL(document.referrer).origin + '/' : '',
    title: document.title,
  },
  disable(disabled) {
    analyticsWindow[`ga-disable-${measurementId}`] = disabled;
    if (disabled) queue.length = 0;
  },
  clearCookies,
  loadTag() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  },
});
const sync = () => {
  hasChoice = consent.sync() !== null;
  banner.hidden = hasChoice;
  close.hidden = !hasChoice;
};
const hide = () => { banner.hidden = true; returnFocus?.focus(); };
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-cookie-settings]') : null;
  if (!target) return;
  returnFocus = target;
  banner.hidden = false;
  close.hidden = !hasChoice;
  heading.focus();
});
banner.querySelectorAll<HTMLButtonElement>('[data-cookie-choice]').forEach((button) => {
  button.addEventListener('click', () => {
    consent.choose(button.dataset.cookieChoice === 'accept');
    hasChoice = true;
    close.hidden = false;
    hide();
  });
});
close.addEventListener('click', hide);
banner.addEventListener('keydown', (event) => { if (event.key === 'Escape' && hasChoice) hide(); });
window.addEventListener('storage', (event) => { if (event.key === consentKey || event.key === null) sync(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
window.addEventListener('btt:inquiry-sent', () => consent.lead());
sync();
