/**
 * Конвенция изображений - см. public/images/README.md
 *
 *   public/images/<путь>-400.webp
 *   public/images/<путь>-800.webp
 *   public/images/<путь>-1200.webp
 *
 * В компоненты передаётся путь БЕЗ суффикса размера и расширения:
 *   <Picture src="ideas/flower-tattoo-ideas/01" ... />
 *
 * Три размера через srcset - требование DESIGN.md §4.
 * Бюджет: превью в сетке ≤60 КБ, полноразмер по тапу ≤200 КБ.
 */

export const WIDTHS = [400, 800, 1200] as const;

/** CDN-префикс. Пусто - отдаём из public/. Проставить домен CDN перед продом. */
export const IMAGE_BASE = import.meta.env.PUBLIC_IMAGE_BASE ?? '';

export function imageUrl(src: string, width: number, ext = 'webp'): string {
  return `${IMAGE_BASE}/images/${src}-${width}.${ext}`;
}

export function srcSet(src: string, ext = 'webp'): string {
  return WIDTHS.map((w) => `${imageUrl(src, w, ext)} ${w}w`).join(', ');
}

/** Дефолтный `sizes` для сетки 2/3/4 колонки из global.css. */
export const GALLERY_SIZES =
  '(min-width: 960px) 288px, (min-width: 640px) 31vw, 47vw';
