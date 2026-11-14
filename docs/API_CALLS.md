# API_CALLS.md — все запросы фронтенда и сверка с s_media_api (раздел 7)

Здесь собраны все HTTP-запросы, которые делает фронтенд, со сверкой по маршрутам
`s_media_api` (файл `s_media_proxy/urls.py`, вьюхи `s_media_proxy/views/`). Данные в
примерах обезличены.

Базовый URL — `VITE_BACKEND_URL` (обозначается `{BASE}`). Все запросы через общий
`apiClient` получают заголовок `Authorization: Bearer <access_token>`; два запроса
токенов выполняются обычным `axios` без этого заголовка.

---

## Таблица запросов

Легенда статуса сверки: ✅ совпадает · ⚠️ поля расходятся · ❌ такого эндпоинта нет.

| # | Метод | Путь (фронт) | Параметры | Тело | Используемые поля ответа | Экран | Сверка |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | POST | `/api/token/` | — | `{ username, password }` | `access`, `refresh` | Вход | ✅ |
| 2 | POST | `/api/token/refresh/` | — | `{ refresh }` | `access`, `refresh` | Перехватчик 401 | ✅ |
| 3 | GET | `/main/` | — | — | `results.files[]` (элементы каталога) | Главная | ✅ |
| 4 | GET | `/storages/` | — | — | `results[]` (хранилища) | Меню (подменю «Каталоги») | ✅ |
| 5 | GET | `/storages/?server_id={id}` | `server_id` | — | `results[]` | Серверы и хранилища | ✅ |
| 6 | GET | `/servers/` | — | — | `results[]` (`id`,`name`,`url`) | Серверы и хранилища | ✅ |
| 7 | POST | `/servers/` | — | `{ name, url }` | — (не читается) | Серверы и хранилища | ✅ |
| 8 | PATCH | `/servers/{id}/` | — | `{ name, url }` | — | Серверы и хранилища | ✅ |
| 9 | DELETE | `/servers/{id}/` | — | — | — | Серверы и хранилища | ✅ |
| 10 | POST | `/storages/` | — | `{ server_id, key, name, path }` | — | Серверы и хранилища | ✅ |
| 11 | PATCH | `/storages/{id}/` | — | `{ server_id, key, name, path }` | — | Серверы и хранилища | ✅ |
| 12 | DELETE | `/storages/{server_id}/{storage_id}/` | — | — | — | Серверы и хранилища | ✅ |
| 13 | GET | `/storage/{server}/{storage}/` | `folder`, `page` | — | `results` (папка: `storage_name`,`path`,`folders[]`,`files[]`), `pagination.{page,items}` | Хранилища | ✅ |
| 14 | GET | `/servers_content/` | — | — | `results.folders[]` | Хранилища (без параметров) | ⚠️ |
| 15 | GET | `/folder_collage/{server}/{storage}/` | `folder`, `timestamp`, `rand` | — | бинарный ответ (image) | Хранилища (коллаж папки) | ✅ |
| 16 | GET | `/folders_image` | `folders`, `timestamp`, `rand` | — | бинарный ответ (image/png) | Хранилища (иконка папки) | ✅ |
| 17 | GET | `/preview/{server}/{storage}/` | `folder`, `filename` | — | бинарный ответ (превью) | Хранилища/Каталог | ✅ |
| 17b | GET | `/preview/{server}/{id}/` | — | — | бинарный ответ (превью из каталога) | Главная/Каталог | ✅ |
| 18 | GET | `/file/{server}/{storage}/` | `folder`, `filename` | — | бинарный ответ (файл/видео) | Хранилища/Каталог | ✅ |
| 18b | GET | `/file/{server}/{id}/` | — | — | бинарный ответ (файл из каталога) | Каталог | ✅ |
| 19 | POST | `/storage/fileinfo/{server}/{storage}/` | — | `{ id \| (folder_path, filename) } + (note \| tags \| is_public)` | — (не читается) | Хранилища/Каталог (редактирование) | ✅ |
| 20 | GET | `/catalog/tags/{server_id}/` | — | — | `results[]` (теги) | Хранилища/Каталог (список тегов) | ✅ |
| 21 | GET | `/catalog_content/{server_id}/{storage_id}/` | `page`, `per_page`, `date_filter`, `date_from`, `date_to`, `search`, `tags`, `public`, `sort`, `sort_direction` | — | `files[]`, `pagination.page` | Каталог | ✅ |

---

## Сверка по каждому запросу

### 1–2. Токены

`POST /api/token/` → `TokenObtainPairView`; `POST /api/token/refresh/` →
`TokenRefreshView` (djangorestframework-simplejwt). ✅ совпадает.

Настройки JWT в API: `ACCESS_TOKEN_LIFETIME = 5 минут`, `REFRESH_TOKEN_LIFETIME = 1
день`, `ROTATE_REFRESH_TOKENS = True`. Поэтому refresh-ответ содержит **и** `access`,
**и** новый `refresh` — фронт корректно обновляет оба токена. (Если бы ротация была
выключена, `refresh` не приходил бы, и фронт перезаписал бы refresh-токен значением
`undefined`.)

### 3. Главная

`GET /main/` → `MainPageViewSet` (`s_media_proxy/views/file_views.py`). ✅ совпадает.
Фронт читает `response.data.results.files`. API возвращает
`{ status, count, results: { files: [...] } }`, к каждому файлу добавляет `server_id`.
При отсутствии серверов/файлов API отдаёт 404.

### 4–5. Список хранилищ

`GET /storages/` → `StorageListViewSet.get`. ✅ совпадает.

- без параметра — опрашивает все серверы пользователя, объединяет `results`;
- с `?server_id=` — только указанный сервер.
- Ответ `{ status, count, results, errors }`; к каждому хранилищу добавляются
  `server_id`, `server_name`, `server_url`.

Фронт в меню читает `results` (без `server_id`), в экране «Серверы» — с
`?server_id={id}`.

### 6–9. Серверы (CRUD)

`/servers/` → `ServerViewSet` (DRF `ModelViewSet`, `IsAuthenticated`). ✅ совпадает.

- `GET` — список (DRF-пагинация `{ count, next, previous, results }`), элементы
  `{ id, name, url, can_add, analyzer_url }`.
- `POST` — создание, сериализатор `ServerSerializer` (поля `name`, `url`); API
  подставляет `user`.
- `PATCH /servers/{id}/` — обновление.
- `DELETE /servers/{id}/` — удаление (проверка, что удаляет владелец).

Фронт использует `id`, `name`, `url`; поля `can_add`/`analyzer_url` не читает.

### 10. Создание хранилища

`POST /storages/` → `StorageListViewSet.post`. ✅ совпадает (эндпоинт есть).

API берёт `server_id` из тела, резолвит сервер и проксирует на `{server.url}/storages/`,
добавляя `user_id` и `created_by` (public_id пользователя). Ответ сервиса
`{ new_storage_id }` фронтом не читается. Поле `key` в теле — ключ доступа к узлу
(проверяется на сервисе; при неверном ключе сервис вернёт ошибку).

### 11. Изменение хранилища

`PATCH /storages/{id}/` → `StorageDetailViewSet.patch`. ✅ совпадает (эндпоинт есть).

API берёт `server_id` из тела (поэтому фронт обязан слать `server_id` в теле, что он
и делает), проксирует на `{server.url}/storages/{storage_id}` с добавлением `user_id`.

### 12. Удаление хранилища

`DELETE /storages/{server_id}/{storage_id}/` → `StorageViewSet.delete`. ✅ совпадает.

Фронт формирует путь как `/storages/{currentServer}/{storage.id}/`, где
`currentServer` — id сервера (целое), `storage.id` — UUID. Соответствует маршруту
`/storages/<int:server_id>/<uuid:storage_id>/`.

Замечание: у `StorageViewSet` есть и `patch` (по тому же пути
`/storages/<server_id>/<storage_id>/`), но фронт его не использует — см. список ниже.

### 13. Содержимое хранилища

`GET /storage/{server}/{storage}/` → `StorageContentViewSet.get`. ✅ совпадает.

Параметры `folder` (путь папки) и `page` проксируются в
`{server.url}/storage/{storage_id}?folder=…&page=…`. Ответ API:
`{ status, results, pagination }`, где `results` — объект папки. API добавляет
`server_id`/`storage_id` к каждой вложенной папке и `user_id`/`user_name` к каждому
файлу. Фронт читает `results.storage_name`, `results.path`, `results.folders`,
`results.files`, `pagination.page`, `pagination.items`.

### 14. Сводка по всем серверам — ⚠️ поля расходятся

`GET /servers_content/` → `ServersContentViewSet.get`. Маршрут существует, но **форма
ответа не совпадает с ожиданиями фронта**.

- API возвращает `{ status, count, results: { folders: [...] } }` (список папок
  верхнего уровня).
- Фронт при этом читает `results.storage_name`, `results.path`, `results.files` —
  этих полей в ответе нет, поэтому шапка («Хранилище: …») в режиме «все серверы»
  пустая, а файлы не отображаются (только папки).

**Рекомендация:** при переписывании согласовать единую форму ответа для «содержимое
хранилища» и «сводка по серверам», либо обрабатывать их раздельно.

### 15. Коллаж папки

`GET /folder_collage/{server}/{storage}/` → `CollageViewSet.get`
(`permission_classes = AllowAny`). ✅ совпадает.

Проксируется в `{server.url}/storage/collage/{storage_id}?folder=…`. Возвращает
изображение. Параметры `timestamp`/`rand` добавляются фронтом только для сброса кэша,
API их игнорирует.

### 16. Иконка папки (коллаж из N папок)

`GET /folders_image?folders=N` → `generate_folders_image` (локальная генерация PNG в
API). ✅ совпадает. `timestamp`/`rand` — клиентский анти-кэш, игнорируются.

### 17 / 17b. Превью

`GET /preview/{server}/{storage}/` → `FilePreviewViewSet.get`. ✅ совпадает.

- С `?folder=…&filename=…` — проксирует в `{server.url}/storage/preview/{storage_id}?folder=…&filename=…`.
- Без `filename` (т.е. когда второй сегмент пути — это id файла каталога) —
  проксирует в `{server.url}/catalog/preview/{file_id}`.

### 18 / 18b. Файл

`GET /file/{server}/{storage}/` → `FileViewSet.get` (аналог превью, но `action_path='file'`).
✅ совпадает. Аналогично: с `folder`/`filename` → `…/storage/file/{storage_id}`; без —
`…/catalog/file/{file_id}`.

### 19. Сохранение данных файла (описание/теги/публичность)

`POST /storage/fileinfo/{server}/{storage}/` → `CatalogFileViewSet.post`. ✅ совпадает.

Проксируется в `{server.url}/storage/fileinfo`, API добавляет `ip` и `storage_id`.
Тело от фронта — либо `{ id, … }` (файл из каталога), либо
`{ folder_path, filename, … }` (файл из хранилища) плюс одно/несколько из
`note`, `tags`, `is_public`. Ответ `{ result: {…} }` фронтом не читается.

### 20. Теги сервера

`GET /catalog/tags/{server_id}/` → `ServerTags.get`. ✅ совпадает. Проксируется в
`{server.url}/catalog/tags`, ответ `{ results: string[] }`.

### 21. Содержимое каталога

`GET /catalog_content/{server_id}/{storage_id}/` → `CatalogContentViewSet.get`.
✅ совпадает.

Все query-параметры проксируются как есть в
`{server.url}/catalog/content?storage_id=…&{query}`. Ответ `{ files, pagination }`.
Замечания:

- фронт добавляет клиентский параметр `date_filter` (см. FRONTEND_SPEC §10) — на
  сервисе такого поля нет, оно игнорируется;
- `tags` отправляется строкой через запятую (на сервисе разделяется обратно);
- `public` отправляется как `true`/`false` либо опускается (когда `null`).

---

## Примеры запросов и ответов (обезличенные)

### Вход

```
POST {BASE}/api/token/
Content-Type: application/json
{ "username": "user", "password": "***" }
```
```
200
{ "access": "<jwt>", "refresh": "<jwt>" }
```

### Обновление токена

```
POST {BASE}/api/token/refresh/
{ "refresh": "<jwt>" }
```
```
200
{ "access": "<jwt>", "refresh": "<jwt>" }
```

### Главная

```
GET {BASE}/main/
Authorization: Bearer <jwt>
```
```json
200
{
  "status": "success",
  "count": 2,
  "results": {
    "files": [
      {
        "id": "0b3f1e9e-…",
        "server_id": 3,
        "note": "Семейный праздник",
        "size": 204800,
        "type": "jpg",
        "tags": ["семья", "2024"],
        "emoji": [],
        "created_at": "2024-08-12T14:30:00"
      }
    ]
  }
}
```

### Список серверов

```
GET {BASE}/servers/
Authorization: Bearer <jwt>
```
```json
200
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    { "id": 3, "name": "Домашний NAS", "url": "http://192.168.1.10:8081", "can_add": false, "analyzer_url": null }
  ]
}
```

### Список хранилищ

```
GET {BASE}/storages/?server_id=3
Authorization: Bearer <jwt>
```
```json
200
{
  "status": "success",
  "count": 1,
  "results": [
    { "id": "9c1e4a2d-…", "name": "Фотоархив", "path": "/mnt/photo", "server_id": 3, "server_name": "Домашний NAS", "server_url": "http://192.168.1.10:8081" }
  ],
  "errors": []
}
```

### Содержимое хранилища

```
GET {BASE}/storage/3/9c1e4a2d-…/?folder=2024&page=1
Authorization: Bearer <jwt>
```
```json
200
{
  "status": "success",
  "results": {
    "name": "2024",
    "storage_name": "Фотоархив",
    "path": "2024",
    "folders_count": { "direct": 2, "total": 5 },
    "files_count": { "direct": 12, "total": 40 },
    "folders": [
      { "name": "отпуск", "storage_id": "9c1e4a2d-…", "storage_name": "Фотоархив", "path": "2024/отпуск", "folders_count": {"direct":0,"total":0}, "files_count": {"direct":6,"total":6}, "server_id": 3 }
    ],
    "files": [
      { "name": "IMG_0001.jpg", "type": "jpg", "full_path": "/mnt/photo/2024/IMG_0001.jpg", "size": 102400, "created_at": "2024-08-01T10:00:00", "group": "image", "note": "", "is_public": false, "tags": [], "emoji": [], "user_id": "1", "user_name": "user" }
    ]
  },
  "pagination": { "page": 1, "per_page": 20, "items": 14 }
}
```

### Содержимое каталога

```
GET {BASE}/catalog_content/3/9c1e4a2d-…/?page=1&per_page=10&search=&tags=семья&public=&sort=created_at&sort_direction=desc
Authorization: Bearer <jwt>
```
```json
200
{
  "files": [
    { "id": "0b3f1e9e-…", "type": "jpg", "note": "Семейный праздник", "size": 204800, "tags": ["семья"], "emoji": [], "created_at": "2024-08-12T14:30:00", "is_public": false, "storage_id": "9c1e4a2d-…", "server_id": 3 }
  ],
  "pagination": { "page": 1, "per_page": 10, "items": 1 }
}
```

### Теги сервера

```
GET {BASE}/catalog/tags/3/
Authorization: Bearer <jwt>
```
```json
200
{ "results": ["семья", "отпуск", "2024"] }
```

### Сохранение данных файла

```
POST {BASE}/storage/fileinfo/3/9c1e4a2d-…/
Authorization: Bearer <jwt>
Content-Type: application/json
{ "folder_path": "2024", "filename": "IMG_0001.jpg", "note": "Закат" }
```
```json
200
{ "result": { "id": "0b3f1e9e-…", "type": "jpg", "is_public": false, "note": "Закат", "size": 102400, "tags": [], "emoji": [], "created_at": "2024-08-01T10:00:00" } }
```

### Формат ошибки (как его понимает фронт)

Перехватчик ошибок строит сообщение так:

- если тело ответа содержит `error.error_message` → берётся оно;
- иначе перебирает поля тела: для массивов — `поле: значения через запятую`, для
  скаляров — `поле: значение`, объединяя строки через `\n`.

Пример тела ошибки узла (пробрасывается API как есть):
```json
{ "error": { "error_code": "file_not_found", "error_message": "File not found" } }
```

---

## Эндпоинты API, которые фронт НЕ вызывает

Существуют в `s_media_api`, но текущий фронт их не использует:

| Метод и путь | Назначение |
| --- | --- |
| `POST /api/token/verify/` | проверка JWT |
| `GET/POST/PUT/PATCH/DELETE /users/`, `/groups/` | стандартные DRF-вьюсеты пользователей/групп |
| `GET/POST/PUT/PATCH/DELETE /profile/` | профиль пользователя (`UserProfileViewSet`) |
| `PATCH /storages/<server_id>/<storage_id>/` | правка хранилища через `StorageViewSet.patch` (фронт использует `PATCH /storages/{id}/`) |
| `POST /upload` | загрузка файла (нет UI загрузки во фронте) |
| `GET/POST/… /analyzer/<server_id>/`, `/analyzer/<server_id>/<path>` | универсальный прокси в s_media_analyzer (анализатор в новой версии; во фронте не используется) |
| `/admin/` | Django admin |
| `/api-auth/` | browsable API (DRF) |

Примечание по анализатору: функционал (лица, карта, неопознанные люди) в текущем
фронте отсутствует — эти эндпоинты появятся в новой версии.
