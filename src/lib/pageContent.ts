/**
 * Генераторы блоков 7, 8, 10 и 11 шаблона страницы (PROJECT.md §6).
 *
 * Зачем генераторы: при 769 страницах BUILD вручную писать по 5 вопросов на
 * каждую нереально, а пустых блоков быть не должно. Генерация даёт
 * осмысленный дефолт, привязанный к зоне и размеру, а флагманские страницы
 * получают ручной текст через поля `faq` / `considerations` / `questions`
 * в combos.json - они всегда перекрывают дефолт.
 *
 * DESIGN.md §11: ни одной формулировки, обещающей что-то про здоровье.
 * Всё, что касается заживления и реакций, адресуется мастеру или врачу.
 */

export interface Combo {
  slug: string;
  h1: string;
  placementLabel: string;
  sizeRange: string;
  details: Record<string, string>;
  faq?: { q: string; a: string }[];
  considerations?: { icon: string; text: string }[];
  questions?: string[];
  searches?: { label: string; href: string }[];
  related: string[];
}

export function faqFor(combo: Combo) {
  if (combo.faq?.length) return combo.faq;

  const area = combo.placementLabel.toLowerCase();

  return [
    {
      q: `How painful is a ${area} tattoo?`,
      a: `Reports vary a lot between people and depend on the session length and exactly where the design sits. Ask your artist what to expect for the ${area} before you book.`,
    },
    {
      q: `What size works best on the ${area}?`,
      a: `Most designs here sit in the ${combo.sizeRange} range. Fine detail needs room - the same design that reads cleanly at the top of that range can close up at the bottom of it.`,
    },
    {
      q: `Can a ${area} tattoo be covered for work?`,
      a: `${combo.details['Work visibility'] ?? 'It depends on the exact position and on what you wear day to day.'} Check your workplace before you commit to a visible area.`,
    },
    {
      q: `How long does a ${area} tattoo take?`,
      a: `Typically ${combo.details['Session time'] ?? '1-3 hours'} for a single piece. Larger or heavily shaded work is usually split across sessions.`,
    },
    {
      q: 'How do I save these ideas?',
      a: 'Tap the bookmark on any image to add it to your shortlist. Saving works without an account, stays in your browser and can be shared with your artist as one link.',
    },
  ];
}

export function considerationsFor(combo: Combo) {
  if (combo.considerations?.length) return combo.considerations;

  const area = combo.placementLabel.toLowerCase();

  return [
    {
      icon: 'briefcase',
      text: `Work visibility - ${combo.details['Work visibility']?.toLowerCase() ?? `think about how often the ${area} is on show`}.`,
    },
    {
      icon: 'wave',
      text: 'Skin movement - the design should follow your anatomy, not fight it.',
    },
    {
      icon: 'sun',
      text: 'Sun exposure - ask your artist about long-term protection for this area.',
    },
    {
      icon: 'ruler',
      text: 'Available space - small details need enough room to age clearly.',
    },
  ];
}

export function questionsFor(combo: Combo) {
  if (combo.questions?.length) return combo.questions;

  const area = combo.placementLabel.toLowerCase();

  return [
    'Can this level of detail work at my chosen size?',
    `How should the design follow my ${area}?`,
    'Would a different position on the same area suit it better?',
    'How many sessions should I expect?',
    'What aftercare do you recommend for me?',
  ];
}

export function searchesFor(combo: Combo, all: Combo[]) {
  if (combo.searches?.length) return combo.searches;

  return combo.related
    .map((slug) => all.find((c) => c.slug === slug))
    .filter((c): c is Combo => Boolean(c))
    .slice(0, 8)
    .map((c) => ({ label: c.h1.toLowerCase(), href: `/ideas/${c.slug}/` }));
}
