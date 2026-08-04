# Изображения

Компоненты ждут файлы по фиксированной конвенции. Путь передаётся **без**
суффикса размера и расширения, три размера подставляются в `srcset`
автоматически (`src/lib/images.ts`).

```
public/images/<путь>-400.webp
public/images/<путь>-800.webp
public/images/<путь>-1200.webp
```

Пример: компонент получает `src="ideas/flower-tattoo-ideas/01"` и ищет
`public/images/ideas/flower-tattoo-ideas/01-400.webp` и так далее.

## Какие пути нужны

| Путь | Где используется | Кадр |
|---|---|---|
| `audience/men`, `audience/women`, `audience/couples` | ряд «Browse by audience» на главной | 4:3 |
| `ideas/<slug>/01` | карточка коллекции в сетках и в «Related» | 3:4 |
| `ideas/<slug>/01…NN` | галерея страницы комбинации, 16-24 штуки | 3:4 |
| `placement-<slug>/01…16` | галерея страницы зоны | 3:4 |
| `subject-<slug>/01…16`, `style-<slug>/01…16`, `size-<slug>/01…16`, `for-<slug>/01…16` | галереи страниц осей | 3:4 |
| `tools/size-3cm`, `size-5cm`, `size-10cm` | гид по размерам на главной | 2:3 |
| `tools/wrist-*`, `tools/arm-*` | страница `/tools/size-guide/` | 2:3 |

Слаги - из `src/data/combos.json` и `src/data/axes.json`.

## Требования (DESIGN.md §4, §9)

- Формат WebP. AVIF включается флагом `avif` у `<Picture>` - только если
  `.avif` реально лежат рядом, иначе браузер упрётся в битый `<source>`.
- Соотношение сторон карточек галереи - **3:4**. Место резервируется через
  `aspect-ratio`, поэтому неверная пропорция даст обрезку, а не сдвиг вёрстки.
- Превью в сетке **≤60 КБ**, полноразмер **≤200 КБ**.
- Ручная отбраковка каждого изображения: пальцы, суставы, «плывущие» линии.
  Это первое, на чём ловят сгенерированные тату (PROJECT.md §8).
- Уникальный alt на каждое изображение. Дефолтные alt из `buildGallery`
  (`…reference {n}`) - заглушка на время сборки, в прод не пускать.

## CDN

`IMAGE_BASE` берётся из переменной окружения `PUBLIC_IMAGE_BASE`. Пусто -
раздача из `public/`. Перед продом выставить домен CDN: он обязателен
(DESIGN.md §9).

```
PUBLIC_IMAGE_BASE=https://cdn.tattoodesignsco.com
```

## Быстрая конвертация

```bash
# из originals/ в три webp нужного размера
for f in originals/*.jpg; do
  n=$(basename "$f" .jpg)
  for w in 400 800 1200; do
    cwebp -q 82 -resize $w 0 "$f" -o "images/$n-$w.webp"
  done
done
```
