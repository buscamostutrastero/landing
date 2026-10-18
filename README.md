# Buscamos tu Trastero

Astro landing page announcing storage units in Casablanca, Zaragoza.
Public copy is Spanish. Commercial information and copy rules are recorded in
`docs/contexto-negocio.md` and `docs/copywriting-style.md`.

## Development

Install dependencies using the existing pnpm lockfile. Use Node 22.12 or newer.

```sh
pnpm install --frozen-lockfile
pnpm exec astro dev --background
```

Manage the server with `pnpm exec astro dev status`, `pnpm exec astro dev logs`
and `pnpm exec astro dev stop`.

## Build and verify

```sh
pnpm build
pnpm test
pnpm check:seo
pnpm exec tsc --noEmit
```

`check:seo` requires a fresh build. It validates the generated HTML, JSON-LD,
visible FAQ answers, text versions, canonical links, local link targets, robots
and sitemap exclusions. Public pages are generated in `dist/`. The existing Cloudflare Pages project is
`landing` (`landing-br9.pages.dev`), account `69be28ac697f25a209c529c1334e6ab9`,
with canonical domain `https://www.buscamostutrastero.com` (the apex redirects
to www), this repository connected, production branch `main`, build command
`pnpm run build`, and output directory `dist`. These settings were verified in
the dashboard on 3 October 2026.

`src/pages/404.astro` generates a top-level `dist/404.html`. Cloudflare Pages
uses it for missing paths, returning HTTP 404 instead of serving the homepage
through its default SPA fallback. Keep this file in every deployment. It has
`noindex, follow` and is excluded from the sitemap. The SEO check verifies its
presence and recovery links, as well as the homepage's business title.
The recovery page uses the existing shadcn Button, Card and Separator components
in `NotFoundPage.tsx`, rendered to static HTML without client hydration. Its
responsive styles are isolated in `src/styles/not-found.css`.

`functions/api/contacto.ts` is bundled separately by Cloudflare Pages. The build
stays static in Astro; no Astro SSR adapter or Node server is needed.
`wrangler.jsonc` records the project name, output directory and compatibility
settings. `public/_routes.json` limits function invocations to the contact API.

For a full local preview including the API, run `pnpm build` followed by
`pnpm preview:pages`. The regular Astro dev server only previews static UI;
Pages Functions are served by Wrangler, not Astro. No Cloudflare account login
is required for local tests.

## 3D storage viewer

Each size card on the homepage has a «Ver en 3D» button that opens one shared
`<dialog>` (`src/components/StorageViewer.astro`). The scope is described in
`docs/plan-simulador-3d.md`: an approximate illustration, not a capacity tool.

- `src/lib/storage-viewer-data.ts`: graphic width × depth per size (matching
  its m²) and a 2.20 m graphic height. These are not facility measurements; do
  not show them as dimensions.
- `src/scripts/storage-viewer.ts` (~1.8 KB gzip, homepage only): dialog, focus,
  size selector, contact link (`/contacto/?size=…`) and fallback.
- `src/scripts/storage-scene.ts`: three.js scene, imported on first open only
  (~141 KB gzip chunk). It renders on demand and stops when the dialog closes.
  It reuses one canvas. An orthographic camera keeps a common scale across
  sizes; near-side walls are cut away instead of fading over the interior.
  The overview and top-down presets expose their selected state. A fixed
  1.70 m reference figure is hidden in the top-down view. Procedural materials,
  soft contact-shadow textures and a detailed open roller need no external assets.
- `src/scripts/storage-objects.ts`: a fixed-size rack with boxes, a lidded bin,
  two floor cartons and a suitcase. The same props appear in every room at their
  original scale. The checked “Mostrar objetos” control hides or shows the example
  without changing the camera, and preserves the choice across size changes and
  dialog reopenings. These are illustrative belongings, not included equipment
  or a capacity recommendation. The floor label appears only in the empty view.
- `three` is pinned to an exact version because three.js breaks API in minor
  releases. Vite's 500 kB chunk warning refers to this lazy chunk.

Verified on 18 October 2026 with Chrome (SwiftShader) at 1440, 768 and 390 px:
three.js is not requested before opening or on `/contacto/`, Escape closes and
returns focus to the card, five open/close cycles keep one canvas, no draw calls
happen while closed, and the illustration fallback appears without WebGL.
A test on a physical phone is still pending.

The visual refinement was checked in the connected Chrome browser at desktop,
768 px and 390 px, with an additional short-landscape layout check. All six size
selections keep the title and contact URL synchronized; Escape restores focus.
The short-screen dialog scrolls its content and keeps the close control visible.
The production scene chunk with props measured 140,845 bytes gzip and the controller 1,846
bytes gzip. The built HTML contains no scene preload and the contact page has no
viewer entry script. Physical-device touch and temperature checks remain pending.
The example geometry was also checked in Node with three.js bounding boxes:
all props retain their dimensions, stay within each of the six illustrative
rooms, and the shelf, floor cartons and suitcase groups do not intersect.

## Commercial content and discovery

- `src/lib/business.ts`: business identity, contact email and the actual content
  update date. Change `updatedAt` when commercial facts change, not on every build.
- `src/lib/storage-content.ts`: sizes, FAQ answers, metadata and image notice.
  HTML, JSON-LD and text exports consume these shared records.
- `src/components/Seo.astro`: canonical and social metadata, JSON-LD, indexing
  controls and discovery links for the homepage text version.
- `src/lib/llms-content.ts`: generates a short content index and complete
  commercial text; no internal documentation is exported.

Astro prerenders these endpoints into static files:

| URL | Content |
| --- | --- |
| `/llms.txt` | Short Markdown index following the llms.txt proposal |
| `/llms-full.txt` | Complete commercial information and FAQ in Markdown |
| `/index.md` | Same complete information as the homepage text alternative |
| `/robots.txt` | Public crawling permission and canonical sitemap URL |
| `/sitemap-index.xml` | Sitemap index generated by `@astrojs/sitemap` |

The homepage advertises `/index.md` through `rel="alternate"` with
`type="text/markdown"`, and `/llms.txt` through `rel="describedby"`. Configure
the static host to serve `.txt` as `text/plain` and `.md` as `text/markdown`,
both in UTF-8, and confirm these URLs return HTTP 200 after deployment.

`llms.txt` is an optional discovery aid, not a ranking guarantee or requirement
for Google's AI search features. Important information remains visible in HTML.
Do not add unconfirmed prices, hours, security claims, reviews or availability.

Incomplete legal templates (`/aviso-legal/` and `/politica-privacidad/`) have
`noindex, follow` and are excluded from the sitemap. After completing and
reviewing their real content, remove the `noindex` prop from those pages and
the corresponding exclusions from `astro.config.mjs`.

## Remaining launch work

Publish the build, confirm crawlability on the actual host, verify Search Console
and Bing Webmaster Tools, submit the sitemap and monitor indexing. Complete the
legal identity and commercial terms; publish actual opening dates, prices,
access hours and original facility photos when confirmed. Do not claim that
search indexing or assistant citations have been verified without account data.

References: [Astro endpoints](https://docs.astro.build/en/guides/endpoints/),
[llms.txt proposal](https://llmstxt.org/),
[Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features).

## Contact flow and email delivery

The main CTA opens `/contacto/`. Visitors choose one of the six sizes or ask
for help, then enter their contact details. Address and postal code are optional.
JavaScript adds the two steps, submission status and inline validation. Without
JavaScript, the complete form posts normally and receives an HTML response.

The Pages Function at `/api/contacto` validates input, consent, origin and payload
size, checks a honeypot and limits attempts to five per IP per ten minutes.
The limiter is isolate-local and is a basic control, not a global quota. It does not store enquiry data or log credentials.

SMTP always sends from and to `contacto@buscamostutrastero.com`; the visitor's
email is `Reply-To`, never `From`. Only SMTP acceptance for the business mailbox
produces a success response. SMTP acceptance is not proof of inbox delivery.
Missing credentials return HTTP 503; errors preserve the visitor's form values.

For local mail tests, copy `.env.example` to `.dev.vars`, configure the actual
SMTP host shown in Zoho mailbox settings, the contacto user and its password or
application password. Production `SMTP_HOST`, `SMTP_PORT` and `SMTP_USER` are declared in
`wrangler.jsonc`, the source of truth for non-secret runtime configuration.
Enter only secret `SMTP_PASS` in **Pages → landing → Settings → Variables and
secrets**. Use the Preview environment for a preview test, and Production for
the launch.
The Zoho trial expired on 13 October 2026, as verified in the admin mailbox
and the Mail Free subscription on 14 October 2026.
`SMTP_HOST` uses `smtp.zoho.eu` for the free organization account; the previous
`smtppro.zoho.eu` endpoint is for paid organization accounts. A diagnostic
request to the deployed Pages API returned `X-Contact-Delivery-Code: EAUTH`.
The hostname correction was published to production on 14 October 2026
(`82c36ecf.landing-br9.pages.dev`). Chrome submission
`PRUEBA FINAL CF-141026-0901-FREE` displayed the success screen with the existing
SMTP credentials. The owner confirmed receipt in the contacto inbox on the
same day. No paid subscription was needed.
Secrets are runtime bindings (`context.env`), never embedded in the browser.
Do not prefix them with `PUBLIC_` or commit `.dev.vars` to source control.

Use port 465 for implicit TLS through Cloudflare’s native socket API;
certificate verification stays enabled. The socket is adapted to a Node stream
for Nodemailer to handle authentication and SMTP, without Node TLS negotiation. Restart the local preview after changing secrets;
Cloudflare Pages needs a new deployment after changing production bindings.
Node compatibility enables Nodemailer and its streams; Cloudflare native
sockets handle outgoing TLS.
Production SMTP bindings were saved in the Cloudflare dashboard on 3 October
2026, including the password entered directly by the account owner as an
encrypted secret. Zoho accepted two labelled fictitious enquiries on the deployed site on
3 October 2026: one HTTP test and one browser submission showing the success
screen. The owner confirmed inbox receipt with a screenshot on 3 October 2026;
the opened message matches browser test `PRUEBA FINAL WEB CF-031026-2300` and
contains all submitted fields. The screenshot does not expose the Reply-To
header, so direct header inspection remains unverified.

The owner supplied the legal name `Hector García Fernandez`, now used in the
legal notice and privacy policy. NIF, legal domicile and the remaining privacy
details are still pending; legal pages remain noindex and outside the sitemap.

After `pnpm build`, run `pnpm test` for input validation, the fixed recipient,
all sizes, SMTP failure handling and HTTP tests against the compiled Pages Function in the Cloudflare workerd runtime. The HTTP
test explicitly uses empty SMTP bindings and never sends a real email. To finish acceptance testing, send clearly labelled fictitious
data through the form on the deployed site, check the message in the contacto
inbox, check reply-to, and verify the success/error screens. Complete the existing
privacy template with the actual controller and processor details before launch.

Client copy specifies “356 días”; this value is retained literally pending
confirmation rather than silently changed to 365. No occupancy percentage is shown.

References: [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/),
[Zoho SMTP settings](https://www.zoho.com/mail/help/zoho-smtp.html).

## Google Analytics and consent

GA4 web stream `16154443777` uses measurement ID `G-7STN70E77R`. This is a
public identifier, not a secret. `AnalyticsConsent.astro` is included in each
HTML layout, including the 404. The controller loads gtag.js only after explicit
analytics consent (basic Consent Mode v2). Advertising consent remains denied;
Google Signals and ad personalization are disabled.

Accept/reject preferences expire after 180 days and can be changed using
“Configurar cookies” in every footer. Rejecting disables the measurement ID and
removes accessible first-party `_ga` cookies. The Google library already loaded
in a consenting session remains in memory, with measurement disabled. Existing
data in Analytics is not deleted by withdrawing consent.

Page URLs use the canonical link without queries or fragments; referrers include
only the origin. Form fields are never passed to Analytics. `generate_lead` is
emitted only after the contact API confirms success and only with consent.
Automatic form interactions and site search were disabled in the GA4 stream
on 18 October 2026; keep them disabled to avoid counting failed form submissions
or collecting search parameters.

The consent tests cover rejection, malformed/expired preferences, blocked storage,
revocation, reacceptance and lead-event gating. Verify initial rejection, acceptance
and withdrawal in a real browser after changing the controller. Cookies and privacy
policies describe the integration; legal identity details remain pending.
