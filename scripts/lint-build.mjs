/**
 * Пред-публикационный линтер. Гоняется по dist/ после сборки.
 *
 * Ловит ровно те классы ошибок, которые мы уже находили руками и которые
 * невозможно заметить глазами на 400 страницах: дубли H1 (страницы начинают
 * конкурировать сами с собой), внутренние ссылки в 404, пустые alt, реклама
 * выше положенного, русский текст в англоязычной выдаче.
 *
 * Запуск:  npm run lint
 * Ошибки дают код возврата 1, предупреждения — 0.
 */
import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join, dirname } from 'node:path';

const DIST = 'dist';

/* Минимум видимого текста над первым рекламным блоком на страницах, где выше
   него меньше восьми изображений. Одна ручка для всего правила — крутить тут.
   Подобран по фактическому распределению сборки: страницы идей дают ~1000
   знаков над блоком, индексы осей давали 220-660 — вот они и были нарушением. */
const MIN_TEXT_BEFORE_AD = 800;
const PUBLIC = 'public';

const errors = [];
const warnings = [];
const err = (rule, msg, where) => errors.push({ rule, msg, where });
const warn = (rule, msg, where) => warnings.push({ rule, msg, where });

const pages = globSync(`${DIST}/**/index.html`);
if (!pages.length) {
  console.error('dist/ пуст — сначала npm run build');
  process.exit(1);
}

const urlOf = (f) => '/' + f.slice(DIST.length + 1).replace(/index\.html$/, '');
const known = new Set(pages.map(urlOf));

const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const CYR = /[А-Яа-яЁё]/;
const ASSET = /\.(webp|avif|png|jpe?g|svg|ico|css|js|xml|txt|json|webmanifest)$/i;

const h1s = new Map();       // текст -> [url]
const titles = new Map();    // тайтл -> [url]
const descs = new Map();     // description -> [url]

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const url = urlOf(file);

  /* --- H1: ровно один на страницу, текст уникален по сайту --------------- */
  const heads = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1]));
  if (heads.length === 0) err('h1-missing', 'нет H1', url);
  if (heads.length > 1) err('h1-multiple', `H1 на странице: ${heads.length}`, url);
  if (heads[0]) {
    if (!h1s.has(heads[0])) h1s.set(heads[0], []);
    h1s.get(heads[0]).push(url);
  }

  /* --- title / description ---------------------------------------------- */
  const t = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!t) err('title-missing', 'нет <title>', url);
  else {
    const v = strip(t[1]);
    if (v.length > 65) warn('title-long', `title ${v.length} символов`, url);
    if (!titles.has(v)) titles.set(v, []);
    titles.get(v).push(url);
  }

  const d = html.match(/<meta name="description" content="([^"]*)"/);
  if (!d) err('desc-missing', 'нет meta description', url);
  else {
    if (!descs.has(d[1])) descs.set(d[1], []);
    descs.get(d[1]).push(url);
  }

  /* --- canonical --------------------------------------------------------- */
  if (!/rel="canonical"/.test(html)) err('canonical-missing', 'нет canonical', url);

  /* --- alt: непустой, уникальный в пределах страницы --------------------- */
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const alts = [];
  for (const tag of imgs) {
    const a = tag.match(/\salt="([^"]*)"/);
    if (!a) { err('alt-missing', 'у <img> нет alt', url); continue; }
    if (a[1].trim()) alts.push(a[1].trim());
  }
  const dupAlt = alts.filter((a, i) => alts.indexOf(a) !== i);
  if (dupAlt.length) warn('alt-duplicate', `повторяются alt: ${[...new Set(dupAlt)].length}`, url);

  /* --- галерея и реклама (DESIGN.md §4, §10) -----------------------------
   * Правило «первый рекламный блок не раньше, чем после 8-го изображения»
   * написано под страницы с полной галереей. Буквальное применение делало
   * нарушителями почти все страницы сайта разом, и проверка превращалась в
   * шум, который перестают читать.
   *
   * Уточнение: если над блоком уже восемь изображений — правило выполнено
   * буквально, и неважно, галерея это или карточки. Если меньше — работает
   * запасное требование: над блоком должно быть хотя бы MIN_TEXT_BEFORE_AD
   * знаков видимого текста. Доля от высоты страницы для этого не годится:
   * на главной блок стоит честно после восьми карточек, но снизу столько
   * текста, что процент выходит мизерный.
   */
  const tiles = [...html.matchAll(/data-gal\b/g)].length;
  if (/^\/ideas\/[^/]+\/$/.test(url) && (tiles < 16 || tiles > 24))
    err('gallery-size', `на странице комбинации ${tiles} изображений, нужно 16-24`, url);

  const ad = html.search(/data-ad-slot/);
  if (ad > -1) {
    const imgsBefore = [...html.matchAll(/<img\b/g)].filter((m) => m.index < ad).length;
    if (imgsBefore < 8) {
      const main = html.indexOf('<main');
      if (main > -1) {
        const text = html
          .slice(main, ad)
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim().length;
        if (text < MIN_TEXT_BEFORE_AD)
          err('ad-too-high', `над рекламой ${text} знаков текста и ${imgsBefore} изображений`, url);
      }
    }
  }

  /* --- внутренние ссылки ведут на существующие страницы ------------------ */
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1];
    if (ASSET.test(href)) continue;
    if (!known.has(href)) err('link-404', `ссылка в никуда: ${href}`, url);
  }

  /* --- кириллица в выдаче ------------------------------------------------ */
  if (CYR.test(html)) {
    const frag = html.match(/[^\n]{0,40}[А-Яа-яЁё][^\n]{0,40}/);
    err('cyrillic', `русский текст: …${(frag ? frag[0] : '').trim().slice(0, 70)}…`, url);
  }

  /* --- ссылки на несуществующие файлы изображений ------------------------ */
  for (const m of html.matchAll(/src="(\/images\/[^"]+)"/g)) {
    const p = join(PUBLIC, m[1]);
    if (!existsSync(p)) warn('image-missing', `нет файла ${m[1]}`, url);
  }
}

/* --- кириллица в собранных ассетах --------------------------------------- */
for (const f of globSync(`${DIST}/**/*.{js,css,txt,xml,webmanifest}`)) {
  if (CYR.test(readFileSync(f, 'utf8'))) err('cyrillic', 'русский текст в ассете', f);
}

/* --- дубли по сайту ------------------------------------------------------ */
for (const [text, urls] of h1s) if (urls.length > 1)
  err('h1-duplicate', `H1 «${text}» на ${urls.length} страницах: ${urls.join(', ')}`, '—');
for (const [text, urls] of titles) if (urls.length > 1)
  warn('title-duplicate', `title «${text.slice(0, 50)}…» на ${urls.length} страницах`, '—');
for (const [, urls] of descs) if (urls.length > 1)
  warn('desc-duplicate', `одинаковый description на ${urls.length} страницах`, '—');

/* --- отчёт --------------------------------------------------------------- */
const group = (list) => {
  const by = new Map();
  for (const x of list) {
    if (!by.has(x.rule)) by.set(x.rule, []);
    by.get(x.rule).push(x);
  }
  return [...by].sort((a, b) => b[1].length - a[1].length);
};

const show = (label, list) => {
  if (!list.length) return;
  console.log(`\n${label}`);
  for (const [rule, items] of group(list)) {
    console.log(`  ${rule} — ${items.length}`);
    for (const i of items.slice(0, 6)) console.log(`      ${i.where}  ${i.msg}`);
    if (items.length > 6) console.log(`      … ещё ${items.length - 6}`);
  }
};

console.log(`Проверено страниц: ${pages.length}`);
show('ОШИБКИ', errors);
show('ПРЕДУПРЕЖДЕНИЯ', warnings);
console.log(`\nИтого: ошибок ${errors.length}, предупреждений ${warnings.length}`);
process.exit(errors.length ? 1 : 0);
