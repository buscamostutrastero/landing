export const measurementId = 'G-7STN70E77R';
export const consentKey = 'btt:analytics-consent:v1';
export const consentLifetime = 180 * 24 * 60 * 60 * 1000;

/** @typedef {{ analytics: boolean, savedAt: number, version: 1 }} Choice */
/**
 * @typedef {object} Options
 * @property {Pick<Storage, 'getItem' | 'setItem'>} storage
 * @property {(...args: unknown[]) => void} command
 * @property {() => void} loadTag
 * @property {(disabled: boolean) => void} disable
 * @property {() => void} clearCookies
 * @property {{ location: string, referrer: string, title: string }} page
 * @property {() => number} [now]
 */

/** @param {Options} options */
export function createAnalyticsConsent(options) {
  const now = options.now ?? Date.now;
  /** @type {Choice | null} */
  let choice = null;
  let started = false;
  let active = false;
  /** @returns {Choice | null} */
  const read = () => {
    try {
      const value = JSON.parse(options.storage.getItem(consentKey) ?? 'null');
      return value?.version === 1 && typeof value.analytics === 'boolean'
        && Number.isFinite(value.savedAt) && value.savedAt <= now()
        && now() - value.savedAt < consentLifetime ? value : null;
    } catch { return null; }
  };
  const apply = () => {
    const granted = choice?.analytics === true && now() - choice.savedAt < consentLifetime;
    options.disable(!granted);
    if (!granted) {
      active = false;
      if (started) options.command('consent', 'update', { analytics_storage: 'denied' });
      options.clearCookies();
      return;
    }
    if (active) return;
    if (!started) {
      options.command('consent', 'default', {
        analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied',
      });
      options.command('js', new Date(now()));
    }
    options.command('consent', 'update', { analytics_storage: 'granted' });
    options.command('config', measurementId, {
      page_location: options.page.location, page_referrer: options.page.referrer,
      page_title: options.page.title, allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: consentLifetime / 1000, cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
    });
    if (!started) {
      options.loadTag();
      started = true;
    }
    active = true;
  };
  return {
    sync() { choice = read(); apply(); return choice?.analytics ?? null; },
    /** @param {boolean} analytics */
    choose(analytics) {
      choice = { version: 1, analytics, savedAt: now() };
      try { options.storage.setItem(consentKey, JSON.stringify(choice)); } catch { /* Keep the choice for this page. */ }
      apply();
    },
    lead() {
      if (started && choice?.analytics && now() - choice.savedAt < consentLifetime) {
        options.command('event', 'generate_lead', { send_to: measurementId });
      }
    },
  };
}
