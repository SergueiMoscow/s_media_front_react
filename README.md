# Media Explorer (React)

Каталогизатор фото и видео. Новая версия фронтенда комплекса **s_media**, переписанная
с Vue 3 + Vuetify на **React + TypeScript**. Объединяет файлы, физически лежащие на разных
компьютерах (сервер/NAS), в разных папках и хранилищах. Система **не создаёт, не изменяет
и не удаляет файлы** — только показывает существующие и ведёт по ним метаданные каталога
(описание, теги, публичность).

Фронтенд обращается только к `s_media_api` (хостинг), который проксирует запросы к
узловому сервису `s_media_service` и проверяет JWT.

## Стек

- **React 19** + **TypeScript**, сборка **Vite 8**
- **MUI (Material UI)** — компоненты и тема
- **TanStack Query** — серверные данные (кэш, инвалидация)
- **React Context** — авторизация и тосты
- **React Router 7** — маршрутизация (с защитой маршрутов)
- **axios** — HTTP-клиент с перехватчиками (JWT + refresh)

## Запуск

```bash
npm install
npm run dev      # Vite dev-сервер (по умолчанию http://localhost:5173)
npm run build    # tsc -b && vite build
npm run preview  # предпросмотр собранного бандла
npm run lint     # oxlint
```

Базовый URL бэкенда задаётся переменной окружения `VITE_BACKEND_URL` (см. `.env` /
`.env.example`), читается через `import.meta.env.VITE_BACKEND_URL`.

## Структура

```
src/
  api/          # axios-клиент, перехватчики, функции запросов, ключи Query
  auth/         # AuthContext (вход/выход, признак авторизации)
  components/   # AppLayout (шапка+меню), FileCard, FolderCard, FilterPanel,
                # Lightbox, PaginationBar, ConfirmDialog, EditableNote, TagMultiselect…
  pages/        # Home, About, Login, Storages, FolderContent, CatalogContent
  router/       # RequireAuth (защита маршрутов)
  types/        # модели данных (см. docs/DATA_MODELS.md)
  utils/        # format, media (URL), подготовка параметров
```

## Экраны

| Экран | Путь | Описание |
| --- | --- | --- |
| Домашняя | `/` | последние файлы каталога по всем серверам |
| О системе | `/about` | статичное описание |
| Вход | `/login` | форма Name/Password |
| Серверы | `/storages` | CRUD серверов и хранилищ |
| Хранилища | `/folder_content` | сводка по всем серверам |
| Хранилища (папка) | `/folder_content/:server/:storage/*` | содержимое папки хранилища |
| Каталог | `/catalog_content/:server_id/:storage_id` | фильтрация и редактирование метаданных |

## Что исправлено относительно старой версии

- **Защита маршрутов** (`RequireAuth`): гость перенаправляется на `/login`.
- **Подтверждение удаления** сервера и хранилища (диалог).
- **Фильтр по публикации и сортировка** подключены к параметрам запроса каталога.
- **Пагинация каталога** (постраничная).
- **Лайтбокс** полноэкранного просмотра изображений с переходами «след./пред.»
  (клавиши ← / →, Esc).
- Корректное чтение поля даты файлов из хранилища (`created`) и каталога (`created_at`).
- Нормальные состояния загрузки/пусто/ошибки и тосты вместо `alert()`.
- Обновление списка хранилищ после добавления/удаления (инвалидация кэша).

## Не входит в первую версию

- Анализатор (лица, карта, неопознанные люди) — `s_media_analyzer`.
- Редактирование реакций-эмодзи в UI.
- Загрузка файлов (`/upload`).

## Деплой (Docker / GitHub Actions)

Сборка — в GitHub Actions (`.github/workflows/build.yml`), образ пушится в GHCR
(`ghcr.io/sergueimoscow/s_media_front_react`). Бэкенд-URL задаётся на этапе сборки
переменной `VITE_BACKEND_URL` (в GitHub: Settings → Secrets and variables →
Actions → Variables → `VITE_BACKEND_URL`).

На сервере:

```bash
docker compose pull && docker compose up -d
```

`docker-compose.yml` ссылается на GHCR-образ (`image:`), локально можно собрать
через `docker compose up --build` (build-arg `BACKEND_URL`, по умолчанию
`https://stage.b-site.ru:8000`).

- `.env` (локальный, для `npm run dev`) — в `.gitignore`, не коммитится.
- `deploy/nginx.conf` — nginx: 80 → 301 на https, 443 TLS (сертификаты
  Let's Encrypt монтируются с хоста `/etc/letsencrypt`), webroot для renewal —
  `./certbot/www`.

## Полезные ссылки

- Документация: [`docs/`](docs/) — FRONTEND_SPEC.md, API_CALLS.md, DATA_MODELS.md.
- Репозитории: `s_media_api`, `s_media_service`, `s_media_front` (старая Vue-версия).
