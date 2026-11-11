import type { Lang } from '../data/profile';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Путь внутри сайта с учётом базового пути. `p` начинается с «/». */
export const path = (p: string) => `${base}${p}`;

/** Тот же путь, но для нужного языка: английский в корне, русский в /ru/. */
export const localized = (lang: Lang, p: string) => path(lang === 'ru' ? `/ru${p}` : p);

/** Пути для страниц, которые собираются из одного шаблона на оба языка. */
export const langPaths = () => [
  { params: { lang: undefined }, props: { lang: 'en' as Lang } },
  { params: { lang: 'ru' }, props: { lang: 'ru' as Lang } },
];
