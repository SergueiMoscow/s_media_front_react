// Модели данных фронтенда. Имена полей совпадают с именами в ответах API.
// См. docs/DATA_MODELS.md.

export interface Server {
  id: string; // числовой id в реестре API (приходит числом, приводится к строке)
  name: string;
  url: string;
  // поля can_add / analyzer_url API возвращает, но фронт их не использует
  can_add?: boolean;
  analyzer_url?: string | null;
}

export interface Storage {
  server_id: string;
  id: string; // UUID хранилища
  name: string;
  path: string;
  server_name?: string;
  server_url?: string;
}

export interface Option {
  value: string;
  title: string;
}

export interface Count {
  direct: number;
  total: number;
}

export interface EmojiCount {
  name: 'heart' | 'ok' | 'fire';
  quantity: number;
}

/**
 * Папка. В зависимости от источника часть полей может отсутствовать:
 * - верхний уровень (root) в `/storage/...` и элементы `/servers_content/`
 *   — это `StorageFolder` (есть storage_id, storage_name, path);
 * - вложенные папки в `/storage/...` — обычные `Folder`, API добавляет только
 *   server_id и storage_id (path/storage_name отсутствуют).
 */
export interface Folder {
  name: string;
  time: string | null;
  size: number;
  folders_count: Count;
  files_count: Count;
  folders?: Folder[];
  files?: FileObject[];
  storage_id?: string;
  storage_name?: string;
  path?: string;
  created_by?: string;
  server_id?: string;
  server_name?: string;
  server_url?: string;
  // вычисляется фронтом
  image_url?: string;
  collage_url?: string;
}

/** Файл — элемент каталога или списка файлов хранилища. */
export interface FileObject {
  // Файл напрямую из хранилища (есть name), либо из каталога (есть id)
  name?: string | null;
  id?: string | null;
  type: string;
  full_path?: string;
  size: number;
  created_at?: string; // файл из каталога
  created?: string; // файл из хранилища (см. схему StorageFile сервиса)
  group?: string;
  note?: string | null;
  is_public?: boolean;
  tags?: string[];
  emoji?: EmojiCount[];
  user_id?: string;
  user_name?: string;
  storage_id?: string;
  server_id?: string;
}

/** Элемент каталога на главной странице (`GET /main/`). */
export interface CatalogObject {
  id: string;
  server_id?: string;
  note?: string | null;
  size: number;
  type: string;
  tags: string[];
  emoji: EmojiCount[];
  created_at?: string;
  is_public?: boolean;
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  items: number;
}

export interface RequestParams {
  page: number;
  per_page: number;
  date_filter: boolean; // только клиентский флаг, на бэкенд не уходит
  date_from: string;
  date_to: string;
  search: string;
  tags: string[];
  public: boolean | null; // null = не фильтровать
  sort: string;
  sort_direction: string;
}

export function defaultCatalogRequest(): RequestParams {
  const today = new Date();
  const dateTo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  return {
    page: 1,
    per_page: 10,
    date_filter: false,
    date_from: '',
    date_to: dateTo,
    search: '',
    tags: [],
    public: null,
    sort: '',
    sort_direction: '',
  };
}
