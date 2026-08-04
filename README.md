# TattooDesignsCo

Astro-проект по `DESIGN.md`, `PROJECT.md` и `tattoo_pagemap.csv`.
Статическая сборка, чистый CSS, системные шрифты, 7 КБ клиентского JS.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/
```

## Что внутри

| Маршрут | Файл | Что это |
|---|---|---|
| `/` | `pages/index.astro` | хаб: H1, оси, головы волны 1, инструменты, FAQ |
| `/ideas/` | `pages/ideas/index.astro` | все комбинации по убыванию объёма |
| `/ideas/<combo>/` | `pages/ideas/[slug].astro` | страница комбинации, 11 блоков PROJECT.md §6 |
| `/ideas/<combo>/<idea>/` | `pages/ideas/[combo]/[idea].astro` | карточка отдельной идеи |
| `/for/<slug>/` | `pages/for/[slug].astro` | ось аудитории |
| `/placement/`, `/subject/`, `/style/`, `/size/` | `pages/*/index.astro` + `[slug].astro` | хабы осей и листья |
| `/tools/` | `pages/tools/*` | подбор места, гид по размерам, квиз |
| `/saved/` | `pages/saved.astro` | подборка из localStorage, `noindex` |
| `/editorial-standards/` | | правила отбора изображений (PROJECT.md §8) |

Данные — `src/data/*.json`, вёрстка их не хардкодит.

## Правки к макетам, внесённые осознанно

1. **Сетка «Popular tattoo ideas».** `family tattoo ideas` (8100) и
   `cover up tattoo ideas` (8100) заменены на `flower` (9900) и `butterfly`
   (8100). Объём выше, и женская ось перестаёт быть нулевой при мужском
   перевесе 5:2 — это соответствует 546,8K против 299,0K из PROJECT.md §3.
2. **Зона Back убрана.** В pagemap все семь back-строк — SKIP-high-AIO.
   Вместо неё Spine (2400, BUILD).
3. **Порядок зон — по объёму оси**, а не на глаз: Forearm 123,8K → Sleeve
   111,8K → Hand 64,9K → Chest 51,1K → Thigh 46,0K → Neck 44,0K → Wrist
   43,8K → Finger 25,1K → Shoulder 22,9K → Behind ear 15,3K → Ribs 10,5K →
   Ankle 8,9K → Spine 2,4K.
4. **Карточки 3:4** через `aspect-ratio`, а не квадрат: DESIGN.md §4.
5. **Чипы — настоящие `<a href>`** с шевронами и `aria-current`. DESIGN.md §6
   называет фильтры без URL самой дорогой ошибкой ниши.
6. **Формулировки в таблице деталей смягчены.** `Moderate · 4–6/10` →
   `Commonly described as moderate`, `Usually 2–4 weeks` → `Ask your artist`.
   DESIGN.md §11 запрещает утверждения про здоровье от лица сайта; шкала боли
   в баллах и срок заживления — именно они.
7. **Страницы идей по умолчанию `noindex, follow`.** 769 комбинаций × 16–24
   идеи это 12–18 тысяч почти одинаковых страниц — профиль scaled content
   abuse, о котором предупреждает PROJECT.md §8. Ссылки работают, вес течёт,
   в индекс страница не лезет. Открывать по одной: `"index": true` у записи в
   `combos.json`.
8. **Сюжет names/words (80,2K), стили japanese и tribal** в осях отсутствуют —
   AIO 40–52%, PROJECT.md §2 относит их к «не строим».

## Что осталось сделать

- **Изображения.** Конвенция и список нужных путей — `docs/images.md`.
- **Реальные счётчики** в `popular.json` (`ideas`) — сейчас правдоподобные числа.
- **Уникальные alt.** `buildGallery` ставит заглушки вида `…reference {n}` для
  комбинаций без ручного списка `items`. В прод такие не пускать — чек-лист
  DESIGN.md §12 требует уникальный alt на каждое изображение.
- **FAQ.** Написан руками для `forearm-tattoo-ideas-for-men`, остальным
  генерируется из `details` и `placementLabel` (`src/lib/pageContent.ts`).
  Флагманским страницам писать вручную.
- **CDN.** `PUBLIC_IMAGE_BASE=https://cdn.…` — DESIGN.md §9 требует CDN.
- **Рекламные юниты.** Слоты зарезервированы (`AdSlot`), скрипт не подключён.
  Высоту слота выставлять равной высоте юнита, иначе поедет CLS.
- **Лайтбокс.** Плитки уже ссылки на страницы идей, лайтбокс навешивается
  поверх как прогрессивное улучшение.
- **sitemap.xml** и `robots.txt`.

## Проверено на сборке

363 страницы, HTML главной 70 КБ, страницы комбинации 106 КБ (лимит §9 — 300 КБ),
app.js 7,2 КБ. Один H1 на странице, чипы — ссылки, первый рекламный блок ровно
после 8-го изображения, ImageObject / FAQPage / BreadcrumbList проставлены,
canonical везде, веб-шрифтов нет, внешний скрипт один.
