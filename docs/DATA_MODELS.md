# Модели данных (раздел 8)

Здесь собраны все структуры данных, с которыми работает фронтенд, в виде интерфейсов
TypeScript. Поля перечислены так, как их видит фронтенд (имена совпадают с именами в
ответах API). Обязательность указана по факту использования: поле без `?` фронтенд
читает безусловно, поле с `?` может отсутствовать.

Идентификаторы бывают двух типов и их нельзя путать:

- **`server_id`** — целочисленный id записи сервера в реестре `s_media_api` (таблица
  `Server`, автоинкремент).
- **`storage_id` / `id` файла в каталоге** — UUID.

---

## 1. Сервер (узел)

```ts
export interface Server {
  id: string;     // числовой id в реестре API (приходит как число, во фронте строка)
  name: string;   // название сервера (≤ 20 символов на уровне API)
  url: string;    // базовый URL s_media_service, напр. http://192.168.1.10:8081
}
```

Фронт использует только эти три поля. API (`ServerSerializer`) дополнительно
возвращает `can_add`, `analyzer_url` (и `analyzer_api_key`, который `write_only` и
наружу не отдаётся) — фронтендом не используются.

---

## 2. Хранилище

```ts
export interface Storage {
  server_id: string;  // id сервера (реестр API), к которому относится хранилище
  id: string;         // UUID хранилища (в s_media_service)
  name: string;       // название хранилища
  path: string;       // путь к папке на узле
}
```

В ответе `GET /storages/` API добавляет к каждому хранилищу `server_id`,
`server_name`, `server_url`. Фронт использует `id`, `name`, `path`, `server_id`.
Сам сервис возвращает также `user_id`, `can_add`, `created_at`, `created_by` — фронтом
не используются.

---

## 3. Справочная пара «значение / заголовок» (для выпадающих списков)

```ts
export interface Option {
  value: string;
  title: string;
}
```

---

## 4. Счётчики

```ts
export interface Count {
  direct: number;  // количество непосредственно в текущей папке
  total: number;   // количество с учётом вложенных папок
}
```

---

## 5. Папка

```ts
export interface Folder {
  name: string;             // имя папки (последний сегмент пути)
  time: string;             // время (модификации?), приходит как ISO-строка
  size: number;             // размер в байтах
  folders_count: Count;     // счётчики вложенных папок
  files_count: Count;       // счётчики файлов
  storage_id: string;       // UUID хранилища
  storage_name: string;     // название хранилища
  path: string;             // путь папки внутри хранилища
  server_id: string;        // id сервера (добавляется API при проксировании)
  server_name: string;      // название сервера (добавляется API)
  server_url: string;       // URL сервера (добавляется API)
  image_url: string;        // URL картинки-заглушки (генерируется фронтом, см. ниже)
  collage_url: string;      // data:image/jpeg;base64,... — коллаж файлов папки
}
```

`image_url` и `collage_url` формируются на клиенте в `processFolder` (см.
FRONTEND_SPEC, «Работа с медиа»). В ответе API их нет.

---

## 6. Параметры текущего просмотра папки

```ts
export interface ParametersFolderView {
  server: string;      // id сервера
  storage: string;     // UUID хранилища
  folder_path: string; // путь папки внутри хранилища ('' — корень)
  page: number;        // номер страницы
}
```

---

## 7. Файл (элемент в каталоге и в списке файлов хранилища)

```ts
export interface FileObject {
  // Для файла напрямую из хранилища (без записи в каталоге)
  name: string | null | undefined;   // имя файла (null/undefined, если файл из каталога)
  id: string | null | undefined;     // UUID файла в каталоге (null/undefined, если файл из хранилища)
  type: string;                      // расширение без точки, напр. 'jpg', 'mp4'
  full_path: string;                 // полный путь файла
  size: number;                      // размер в байтах
  created_at: string;                // дата создания (ISO-строка)
  group: string;                     // группа: 'image' | 'video' | 'doc'
  image_url: string;                 // URL превью (генерируется фронтом)
  selected: boolean;                 // выделение для групповых операций (не используется в UI)

  // Значения из БД каталога
  note: string;                      // описание/заметка
  is_public: boolean;                // публичность
  tags: Array<string>;               // список тегов
  emoji: Array<Object>;              // реакции-эмодзи (см. EmojiCount); в UI не редактируются
  user_id: string;                   // id владельца (подставляется API при проксировании)
  user_name: string;                 // username владельца (подставляется API)
}
```

---

## 8. Элемент каталога (главная страница)

```ts
export interface CatalogObject {
  id: string;           // UUID файла в каталоге
  server_id: string;    // id сервера, откуда файл (добавляется API в /main/)
  note: string;         // описание
  size: number;         // размер в байтах
  type: string;         // расширение без точки
  tags: Array<string>;  // теги
  emoji: Array<Object>; // реакции-эмодзи
  created_at: string;   // дата создания (ISO-строка)
}
```

---

## 9. Реакции-эмодзи (объект элемента `emoji`)

Фронт не использует содержимое, но структура, приходящая от сервиса, такая:

```ts
export interface EmojiCount {
  name: 'heart' | 'ok' | 'fire'; // допустимые значения
  quantity: number;              // количество
}
```

---

## 10. Параметры запроса каталога (фильтр)

```ts
export interface RequestPrams {
  page: number;
  per_page: number;
  date_filter: boolean;      // включён ли фильтр по дате (только клиент)
  date_from: string;         // 'YYYY-MM-DD' (пустая строка, если фильтр выключен)
  date_to: string;           // 'YYYY-MM-DD' (по умолчанию сегодня)
  search: string;            // поисковая строка
  tags: Array<string>;       // список тегов
  public: boolean | null;    // null = не фильтровать
  sort: string;              // поле сортировки ('' = по умолчанию)
  sort_direction: string;    // 'asc' | 'desc' ('' = по умолчанию)
}
```

Вариант после подготовки к отправке (теги — строка через запятую):

```ts
export interface PreparedRequestPrams {
  page: number;
  per_page: number;
  date_filter: boolean;
  date_from: string;
  date_to: string;
  search: string;
  tags: string;              // теги, объединённые запятой
  public: boolean | null;
  sort: string;
  sort_direction: string;
}
```

---

## 11. Значения по умолчанию для фильтра каталога

```ts
export function defaultCatalogRequest(): RequestPrams {
  return {
    page: 1,
    per_page: 10,
    date_filter: false,
    date_from: '',
    date_to: 'YYYY-MM-DD', // сегодняшняя дата
    search: '',
    tags: [],
    public: null,
    sort: '',
    sort_direction: '',
  };
}
```

---

## 12. Ответы API (формы, используемые фронтом)

Сводка структур ответов, на которые опирается фронт (подробно — в API_CALLS.md):

- **Список объектов** (servers, storages, теги): `{ results: [...] }` — DRF-пагинация у
  `/servers/` добавляет `count`, `next`, `previous`.
- **Главная** (`GET /main/`): `{ status, count, results: { files: CatalogObject[] } }`.
- **Содержимое хранилища** (`GET /storage/...`):
  `{ status, results: Folder, pagination: { page, per_page, items } }`.
- **Сводка по всем серверам** (`GET /servers_content/`):
  `{ status, count, results: { folders: Folder[] } }`.
- **Содержимое каталога** (`GET /catalog_content/...`):
  `{ files: FileObject[], pagination: { page, per_page, items } }`.
- **Теги сервера** (`GET /catalog/tags/...`): `{ results: string[] }`.
- **Сохранение данных файла** (`POST /storage/fileinfo/...`):
  `{ result: { id, type, is_public, note, size, tags, emoji, created_at } }` (фронт ответ
  не читает).
- **Токены** (`POST /api/token/`, `/api/token/refresh/`): `{ access, refresh }`.
- **Создание хранилища** (`POST /storages/`): `{ new_storage_id: UUID }` (фронт не
  читает).
