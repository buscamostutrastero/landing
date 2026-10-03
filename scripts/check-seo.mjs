import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), 'utf8');
const [html, index, full, markdown, robots, sitemap] = await Promise.all([
  read('index.html'), read('llms.txt'), read('llms-full.txt'), read('index.md'),
  read('robots.txt'), read('sitemap-0.xml'),
]);
const script = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
assert.ok(script, 'The homepage must contain structured data.');
const graph = JSON.parse(script[1])['@graph'];
const company = graph.find((node) => node['@type'] === 'SelfStorage');
const page = graph.find((node) => Array.isArray(node['@type']) && node['@type'].includes('FAQPage'));
const sizes = graph.find((node) => node['@type'] === 'ItemList');
const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const origin = new URL(company.url).origin;

assert.equal(full, markdown, 'Both complete text versions must stay synchronized.');
assert.ok(index.startsWith(`# ${company.name}\n\n>`), 'llms.txt needs a title and summary.');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'The homepage needs one H1.');
assert.equal(sizes.numberOfItems, 6);
assert.equal((html.match(/class="storage-card"/g) || []).length, sizes.numberOfItems);
assert.equal(company.email, 'contacto@buscamostutrastero.com');
assert.equal(company.priceRange, undefined, 'Do not publish an unconfirmed price range.');
assert.equal(company.openingHours, undefined, 'Do not publish unconfirmed access hours.');
assert.ok(html.includes('href="/contacto/"'));
const contact = await read('contacto/index.html');
assert.ok(contact.includes('action="/api/contacto"'));
assert.ok(contact.includes(company.email));
assert.ok(!visible.includes('65 %') && !contact.includes('65 %'));
assert.ok(index.includes(company.email) && full.includes(company.email));
assert.ok(full.includes(company.address.streetAddress));
assert.ok(full.includes(page.dateModified));
assert.ok(visible.includes(page.dateModified.slice(0, 4)));
assert.ok(html.includes(`datetime="${page.dateModified}"`));
assert.ok(html.includes(`rel="canonical" href="${company.url}"`));
assert.ok(html.includes('rel="alternate" type="text/markdown"'));
assert.ok(html.includes(`href="${origin}/index.md"`));
assert.ok(html.includes(`rel="describedby" type="text/plain" href="${origin}/llms.txt"`));

for (const { name, acceptedAnswer } of page.mainEntity) {
  assert.ok(visible.includes(name), `Missing visible question: ${name}`);
  assert.ok(visible.includes(acceptedAnswer.text), `Missing visible answer: ${name}`);
  assert.ok(full.includes(name) && full.includes(acceptedAnswer.text), `Text version differs: ${name}`);
}
for (const { item } of sizes.itemListElement) {
  const size = item.name.match(/Trastero de (.+?) m²/)[1];
  assert.ok(full.includes(`### Trastero de ${size} m²`));
}
assert.ok(robots.includes('User-agent: *\nAllow: /'));
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`));
assert.ok(!sitemap.match(/\.(?:txt|md)<\/loc>/), 'Text alternatives must not compete with HTML in the sitemap.');
for (const path of ['aviso-legal', 'politica-privacidad']) {
  assert.ok(!sitemap.includes(`/${path}/`), 'Incomplete legal templates must stay out of the sitemap.');
  assert.ok((await read(`${path}/index.html`)).includes('content="noindex, follow"'));
}
for (const content of [index, full]) {
  for (const [, target] of content.matchAll(/\]\(([^)]+)\)/g)) {
    const url = new URL(target);
    if (url.protocol === 'mailto:') continue;
    assert.equal(url.origin, origin, 'Text files must link to the canonical site.');
    const path = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
    const linked = await read(path.slice(1));
    if (url.hash) assert.ok(linked.includes(`id="${url.hash.slice(1)}"`), `Broken anchor: ${target}`);
  }
}
console.log('SEO checks passed: HTML, JSON-LD, text endpoints, links, robots and sitemap.');
