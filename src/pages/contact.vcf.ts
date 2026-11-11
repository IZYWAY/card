import type { APIRoute } from 'astro';
import { profile, telegramUrl, instagramUrl } from '../data/profile';

/** Файл контакта для кнопки «Сохранить контакт». Собирается из src/data/profile.ts. */
export const GET: APIRoute = () => {
  const [first = '', ...rest] = profile.name.en.split(/\s+/);
  const last = rest.join(' ');
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(profile.name.en)}`,
    `TITLE:${esc(profile.role.en.join(' '))}`,
    `NOTE:${esc(profile.tagline.en)} Telegram: @${profile.telegram}`,
    `URL:${profile.siteUrl}`,
    `item1.URL:${telegramUrl}`,
    'item1.X-ABLabel:Telegram',
    `item2.URL:${instagramUrl}`,
    'item2.X-ABLabel:Instagram',
    'END:VCARD',
  ];

  return new Response(lines.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/vcard; charset=utf-8' },
  });
};
