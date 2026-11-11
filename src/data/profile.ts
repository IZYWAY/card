// Все личные данные визитки лежат в этом файле.
export const profile = {
  site: 'https://izyway.github.io/card/',
  siteLabel: 'izyway.github.io/card',
  telegram: { handle: '@izyway', url: 'https://t.me/izyway' },
  instagram: { handle: '@izywayy', url: 'https://www.instagram.com/izywayy' },
  vcf: 'daniil-evsegneev.vcf',
};

export type Lang = 'en' | 'ru';

export const copy = {
  en: {
    first: 'Daniil',
    last: 'Evsegneev',
    role: 'AI product builder',
    line: 'I build AI-powered products for business: Telegram mini apps, apps, websites and custom tools.',
    makes: ['Mini apps', 'Apps', 'Websites', 'Business tools'],
    telegram: 'Message on Telegram',
    save: 'Save contact',
    flipToQr: 'Show QR code',
    flipHint: 'Tap the card: QR code on the back',
    scan: 'Scan to open this card',
    chooserTitle: 'Two directions for the first screen',
    chooserLead: 'Open both on your phone and pick one.',
    optionA: 'Foil card',
    optionADesc: 'A badge that tilts with the phone and flips to a QR code.',
    optionB: 'Kinetic type',
    optionBDesc: 'The name across the full screen, letters in motion.',
    description: 'Daniil Evsegneev builds AI-powered products for business: Telegram mini apps, apps, websites and custom tools.',
  },
  ru: {
    first: 'Даниил',
    last: 'Евсегнеев',
    role: 'Делаю ИИ-продукты',
    line: 'Делаю ИИ-продукты для бизнеса: мини-приложения в Telegram, приложения, сайты и программы под заказ.',
    makes: ['Мини-аппы', 'Приложения', 'Сайты', 'Программы'],
    telegram: 'Написать в Telegram',
    save: 'Сохранить контакт',
    flipToQr: 'Показать QR-код',
    flipHint: 'Нажмите на карточку: на обороте QR-код',
    scan: 'Наведите камеру, чтобы открыть визитку',
    chooserTitle: 'Два варианта первого экрана',
    chooserLead: 'Откройте оба на телефоне и выберите один.',
    optionA: 'Карточка с фольгой',
    optionADesc: 'Бейдж наклоняется вслед за телефоном и переворачивается на QR-код.',
    optionB: 'Крупная типографика',
    optionBDesc: 'Имя во весь экран, буквы в движении.',
    description: 'Даниил Евсегнеев делает ИИ-продукты для бизнеса: мини-приложения в Telegram, приложения, сайты и программы под заказ.',
  },
} as const;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ссылка внутри сайта с учётом базового пути и языка. */
export function href(lang: Lang, path = ''): string {
  const prefix = lang === 'ru' ? '/ru' : '';
  const clean = path.replace(/^\/|\/$/g, '');
  return `${base}${prefix}/${clean ? clean + '/' : ''}`;
}

export function asset(file: string): string {
  return `${base}/${file}`;
}

export function langPaths() {
  return [{ params: { lang: undefined } }, { params: { lang: 'ru' } }];
}
