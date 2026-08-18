import type { GalleryItem } from '@components/GalleryGrid.astro';

/**
 * Слоты галереи под конвенцию имён файлов (public/images/README.md).
 * DESIGN.md §4: 16-24 изображения на странице комбинации.
 *
 * Если в combos.json у галереи есть массив `items`, берём его - там реальные
 * названия, размеры и параметры каждого изображения. Если нет, генерируем
 * заглушки: страницу можно собрать и посмотреть до того, как изображения
 * отобраны. В прод заглушки не пускать - §12, чек-лист требует уникальный alt
 * и точную подпись на каждое изображение.
 */
export interface GalleryDefaults {
  placement: string;
  size: string;
  style: string;
  color: string;
  altPattern: string;
  items?: IdeaRecord[];
}

export interface IdeaRecord {
  slug: string;
  name: string;
  placement: string;
  size: string;
  style: string;
  color: string;
  shading?: string;
  session?: string;
  summary?: string;
  /** Индексировать эту страницу идеи. По умолчанию false - см. [idea].astro */
  index?: boolean;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildGallery(
  slug: string,
  count: number,
  defaults: GalleryDefaults,
  /**
   * Базовый путь для ссылок с плиток, например "/ideas/forearm-tattoo-ideas/".
   * Передаётся ТОЛЬКО страницами комбинаций - только у них есть страницы
   * отдельных идей. Оси (/placement/, /for/ и т.д.) своих idea-страниц не
   * порождают, и ссылка с плитки там вела бы в 404.
   */
  linkBase?: string,
): GalleryItem[] {
  const records = ideaRecords(slug, count, defaults);

  return records.map((r, i) => ({
    image: `ideas/${slug}/${String(i + 1).padStart(2, '0')}`,
    alt: r.summary ? `${r.name} - ${r.summary}` : r.name,
    placement: r.placement,
    size: r.size,
    style: r.style,
    color: r.color,
    /* Плитка галереи - обычная ссылка на страницу идеи. Лайтбокс
       навешивается поверх как прогрессивное улучшение (DESIGN.md §5). */
    href: linkBase ? `${linkBase}${r.slug}/` : undefined,
  }));
}

/** Полные записи идей - для страниц /ideas/<combo>/<idea>/ */
export function ideaRecords(
  slug: string,
  count: number,
  defaults: GalleryDefaults,
): IdeaRecord[] {
  if (defaults.items?.length) return defaults.items;

  // Нижняя граница снята намеренно: требование «16–24 изображения» из
  // DESIGN.md §4 относится к страницам комбинаций и теперь проверяется
  // линтером. Хабам осей нужна короткая галерея, а помощник не должен
  // молча дорисовывать слоты под картинки, которых никто не снимал.
  const n = Math.min(Math.max(count, 1), 24);

  return Array.from({ length: n }, (_, i) => ({
    slug: `idea-${String(i + 1).padStart(2, '0')}`,
    name: defaults.altPattern.replace('{n}', String(i + 1)),
    placement: defaults.placement,
    size: defaults.size,
    style: defaults.style,
    color: defaults.color,
  }));
}

export function imagePath(comboSlug: string, index: number): string {
  return `ideas/${comboSlug}/${String(index + 1).padStart(2, '0')}`;
}

/**
 * Сколько идей реально на странице комбинации.
 *
 * Считается из того же источника, из которого строится галерея, поэтому
 * подпись «· N ideas» не может разойтись с содержимым страницы. Раньше это
 * число лежало отдельным полем в popular.json и было просто вписано руками,
 * карточка обещала 124 идеи там, где на странице было 24.
 *
 * Верхняя граница 24 взята из DESIGN.md §4 (16-24 изображения на странице).
 * Хочешь показывать больше, это делается новыми комбинациями, а не цифрой
 * в подписи.
 */
export function ideaCount(combo: {
  images: number;
  gallery?: { items?: unknown[] };
}): number {
  if (combo.gallery?.items?.length) return combo.gallery.items.length;
  return Math.min(Math.max(combo.images, 16), 24);
}
