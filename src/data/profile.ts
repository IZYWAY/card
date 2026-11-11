// Все личные данные и тексты визитки лежат в этом файле.
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
    telegram: 'Message on Telegram',
    save: 'Save contact',
    makes: ['Mini apps', 'Apps', 'Websites', 'Business tools'],
    flipToQr: 'Show QR code',
    flipHint: 'Tap the card: QR code on the back',
    dragHint: 'Pull the badge. Tap it to see the QR code',
    description:
      'Daniil Evsegneev builds AI-powered products for business: Telegram mini apps, apps, websites and custom tools.',

    whatTitle: 'What I build',
    what: [
      { name: 'Telegram mini apps', line: 'Your product opens right inside Telegram. No install, no sign-up.' },
      { name: 'Apps', line: 'Mobile and web apps, from the first prototype to launch.' },
      { name: 'Websites', line: 'Fast sites that explain what you do and bring in requests.' },
      { name: 'Business tools', line: 'Software built around how your team works: requests, reports, automation.' },
    ],

    worksTitle: 'Concepts',
    worksLead: 'Three concepts that show what I can build for you. These are not client projects.',
    conceptTag: 'Concept',
    works: {
      meet: {
        name: 'Event networking mini app',
        line: 'Guests find each other and swap contacts inside Telegram.',
        bar: 'Forum · People nearby',
        people: [
          { who: 'Founder, payments', wants: 'Looking for investors' },
          { who: 'Investor', wants: 'Looking for AI products' },
          { who: 'Marketing lead', wants: 'Looking for partners' },
        ],
        action: 'Swap contacts',
      },
      chat: {
        name: 'AI assistant for customer chats',
        line: 'Answers customers in the messenger and books a meeting.',
        bar: 'AI assistant · online',
        messages: [
          { from: 'them', text: 'Hi! Do you have a slot this week?' },
          { from: 'ai', text: 'Yes. Thursday 15:00 or Friday 11:00. Which one works?' },
          { from: 'them', text: 'Thursday' },
          { from: 'ai', text: 'Booked: Thursday, 15:00. I will send a reminder.' },
        ],
      },
      desk: {
        name: 'Business dashboard',
        line: 'Requests, statuses and a daily report on one screen.',
        bar: 'Requests · today',
        rows: [
          { what: 'Website request', status: 'New', tone: 'new' },
          { what: 'Call back', status: 'In progress', tone: 'work' },
          { what: 'Invoice sent', status: 'Done', tone: 'done' },
          { what: 'Demo booked', status: 'Done', tone: 'done' },
        ],
        chart: 'This week',
      },
    },

    contactTitle: ['Let’s', 'talk'],
    contactLead: 'Tell me what you want to build. I reply on Telegram.',
    instagram: 'Instagram',
    scan: 'Scan to open this card',
  },
  ru: {
    first: 'Даниил',
    last: 'Евсегнеев',
    role: 'Делаю ИИ-продукты',
    line: 'Делаю ИИ-продукты для бизнеса: мини-приложения в Telegram, приложения, сайты и программы под заказ.',
    telegram: 'Написать в Telegram',
    save: 'Сохранить контакт',
    makes: ['Мини-аппы', 'Приложения', 'Сайты', 'Программы'],
    flipToQr: 'Показать QR-код',
    flipHint: 'Нажмите на карточку: на обороте QR-код',
    dragHint: 'Потяните бейдж. Нажмите, чтобы увидеть QR-код',
    description:
      'Даниил Евсегнеев делает ИИ-продукты для бизнеса: мини-приложения в Telegram, приложения, сайты и программы под заказ.',

    whatTitle: 'Что я делаю',
    what: [
      { name: 'Мини-приложения в Telegram', line: 'Продукт открывается прямо в Telegram. Без установки и регистрации.' },
      { name: 'Приложения', line: 'Мобильные и веб-приложения: от первого прототипа до запуска.' },
      { name: 'Сайты', line: 'Быстрые сайты, которые объясняют, чем вы занимаетесь, и приводят заявки.' },
      { name: 'Программы для бизнеса', line: 'Софт под вашу команду: заявки, отчёты, автоматизация.' },
    ],

    worksTitle: 'Концепты',
    worksLead: 'Три концепта, которые показывают, что я могу сделать для вас. Это не клиентские проекты.',
    conceptTag: 'Концепт',
    works: {
      meet: {
        name: 'Мини-приложение для знакомств на событии',
        line: 'Гости находят друг друга и обмениваются контактами прямо в Telegram.',
        bar: 'Форум · Кто рядом',
        people: [
          { who: 'Основатель, платежи', wants: 'Ищет инвесторов' },
          { who: 'Инвестор', wants: 'Ищет ИИ-продукты' },
          { who: 'Маркетолог', wants: 'Ищет партнёров' },
        ],
        action: 'Обменяться контактами',
      },
      chat: {
        name: 'ИИ-ассистент для переписки с клиентами',
        line: 'Отвечает клиентам в мессенджере и записывает на встречу.',
        bar: 'ИИ-ассистент · на связи',
        messages: [
          { from: 'them', text: 'Здравствуйте! Есть время на этой неделе?' },
          { from: 'ai', text: 'Да. Четверг 15:00 или пятница 11:00. Что удобнее?' },
          { from: 'them', text: 'Четверг' },
          { from: 'ai', text: 'Записал: четверг, 15:00. Пришлю напоминание.' },
        ],
      },
      desk: {
        name: 'Рабочая панель для бизнеса',
        line: 'Заявки, статусы и отчёт за день на одном экране.',
        bar: 'Заявки · сегодня',
        rows: [
          { what: 'Заявка с сайта', status: 'Новая', tone: 'new' },
          { what: 'Перезвонить', status: 'В работе', tone: 'work' },
          { what: 'Счёт отправлен', status: 'Готово', tone: 'done' },
          { what: 'Демо назначено', status: 'Готово', tone: 'done' },
        ],
        chart: 'Эта неделя',
      },
    },

    contactTitle: ['Давайте', 'обсудим'],
    contactLead: 'Расскажите, что хотите сделать. Отвечаю в Telegram.',
    instagram: 'Instagram',
    scan: 'Наведите камеру, чтобы открыть визитку',
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
