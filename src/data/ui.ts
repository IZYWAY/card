import type { Lang } from './profile';

/** Тексты интерфейса на двух языках. */
export const ui = {
  en: {
    telegram: 'Message on Telegram',
    save: 'Save contact',
    variants: 'Options',
    flipHint: 'Tap the card. The QR code is on the back',
    flipToBack: 'Flip the card to see the QR code',
    flipToFront: 'Flip the card back',
    enableTilt: 'Turn on tilt',
    scan: 'Scan to open',
    flip: 'Flip',
    qrAlt: 'QR code with the address of this page',
    langLabel: 'Language',
    pickerTitle: 'First screen: two options',
    pickerLead:
      'Same colours, fonts and text. Only the idea differs. Open both on your phone and pick one.',
    optionA: 'Holographic badge',
    optionADesc:
      'A 3D card with shimmering foil. It tilts with the phone, flips on tap and shows a QR code on the back.',
    optionB: 'Kinetic type',
    optionBDesc:
      'No card. The name fills the screen: the letters fly into place and swell under your finger or as the phone tilts.',
    open: 'Open',
    draft: 'Draft. The site address in the QR code is a placeholder',
  },
  ru: {
    telegram: 'Написать в Telegram',
    save: 'Сохранить контакт',
    variants: 'Варианты',
    flipHint: 'Нажмите на карточку: на обороте QR-код',
    flipToBack: 'Перевернуть карточку и показать QR-код',
    flipToFront: 'Перевернуть карточку обратно',
    enableTilt: 'Включить наклон',
    scan: 'Наведите камеру',
    flip: 'Оборот',
    qrAlt: 'QR-код с адресом этой страницы',
    langLabel: 'Язык',
    pickerTitle: 'Первый экран: два варианта',
    pickerLead:
      'Цвета, шрифты и текст одинаковые. Отличается только приём. Откройте оба на телефоне и выберите один.',
    optionA: 'Голографический бейдж',
    optionADesc:
      'Объёмная карточка с переливающейся фольгой. Наклоняется вслед за телефоном, по нажатию переворачивается, на обороте QR-код.',
    optionB: 'Живая типографика',
    optionBDesc:
      'Без карточки. Имя во весь экран: буквы слетаются на место и набухают под пальцем или при наклоне телефона.',
    open: 'Открыть',
    draft: 'Черновик. Адрес сайта в QR-коде пока временный',
  },
} satisfies Record<Lang, Record<string, string>>;
