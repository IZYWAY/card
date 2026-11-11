# Шрифты

Файлы лежат в проекте и не грузятся с внешних серверов. Каждый шрифт разрезан
на два набора — латиница и кириллица; браузер скачивает только нужный
(`unicode-range` в `src/styles/fonts.css`).

| Файл | Шрифт | Начертания |
| --- | --- | --- |
| `unbounded-*.woff2` | Unbounded | вариативный, 200–900 |
| `onest-*.woff2` | Onest | вариативный, 100–900 |
| `martian-mono-*.woff2` | Martian Mono | 400 |

Все три шрифта распространяются по лицензии SIL Open Font License 1.1
(https://openfontlicense.org). Наборы взяты из пакетов Fontsource
(те же, что отдаёт Google Fonts).
