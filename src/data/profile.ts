import { SITE_URL } from '../../site.config.mjs';

/**
 * Все личные данные сайта лежат здесь.
 * Сейчас это ЗАГЛУШКИ: замените значения на настоящие.
 */
export const profile = {
  // Имя и фамилия. Первое слово — имя, второе — фамилия.
  name: {
    en: 'Name Surname', // ЗАГЛУШКА: имя и фамилия латиницей
    ru: 'Имя Фамилия', // ЗАГЛУШКА: имя и фамилия кириллицей
  },

  // Одна строка о деле.
  tagline: {
    en: 'I build AI products to order: Telegram mini apps, apps, websites and business tools.',
    ru: 'Делаю ИИ-продукты под заказ: мини-приложения в Telegram, приложения, сайты и программы для бизнеса.',
  },

  // Короткая подпись на самой карточке (две строки).
  role: {
    en: ['AI products', 'made to order'],
    ru: ['ИИ-продукты', 'под заказ'],
  },

  // Ники без символа @.
  telegram: 'your_telegram', // ЗАГЛУШКА
  instagram: 'your_instagram', // ЗАГЛУШКА

  // Адрес сайта: зашит в QR-код на обороте карточки.
  // Меняется в одном месте — в файле site.config.mjs.
  siteUrl: SITE_URL,
} as const;

export type Lang = 'en' | 'ru';
export const langs: Lang[] = ['en', 'ru'];

export const telegramUrl = `https://t.me/${profile.telegram}`;
export const instagramUrl = `https://instagram.com/${profile.instagram}`;

/** Адрес сайта без https:// и завершающей косой черты — для подписи под QR. */
export const siteLabel = profile.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

/** Первые буквы имени и фамилии. */
export function initials(lang: Lang): string {
  return profile.name[lang]
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}
