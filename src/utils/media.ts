import type { FileObject, RequestParams } from '../types/models';

export const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'bmp', 'svg', 'webp'];
const VIDEO_TYPES = ['mp4', 'webm', 'ogv'];

export function isImageType(type?: string): boolean {
  return Boolean(type && IMAGE_TYPES.includes(type.toLowerCase()));
}

export function isVideoType(type?: string): boolean {
  return Boolean(type && VIDEO_TYPES.includes(type.toLowerCase()));
}

/**
 * URL превью файла.
 * - файл из хранилища (есть name): /preview/{server}/{storage}/?folder=…&filename=…
 * - файл из каталога (есть id):   /preview/{server}/{id}/
 */
export function previewUrl(server: string, storage: string, file: FileObject, folderPath = ''): string {
  if (file.name) {
    return `${BASE_URL}/preview/${server}/${storage}/?folder=${encodeURIComponent(folderPath)}&filename=${encodeURIComponent(file.name)}`;
  }
  if (file.id) {
    return `${BASE_URL}/preview/${server}/${file.id}/`;
  }
  return '';
}

/** URL файла целиком (для видео). */
export function fileUrl(server: string, storage: string, file: FileObject, folderPath = ''): string {
  if (file.name) {
    return `${BASE_URL}/file/${server}/${storage}/?folder=${encodeURIComponent(folderPath)}&filename=${encodeURIComponent(file.name)}`;
  }
  if (file.id) {
    return `${BASE_URL}/file/${server}/${file.id}/`;
  }
  return '';
}

/** URL превью для элемента каталога с главной страницы. */
export function catalogPreviewUrl(serverId: string, id: string): string {
  return `${BASE_URL}/preview/${serverId}/${id}/`;
}

/** Картинка-заглушка папки (коллаж из N иконок-папок). */
export function foldersImageUrl(foldersCount: number): string {
  return `${BASE_URL}/folders_image?folders=${foldersCount}&timestamp=${Date.now()}&rand=${Math.random()}`;
}

/** URL коллажа файлов папки. */
export function folderCollageUrl(server: string, storage: string, folder: string): string {
  return `${BASE_URL}/folder_collage/${server}/${storage}/?folder=${encodeURIComponent(folder)}&timestamp=${Date.now()}&rand=${Math.random()}`;
}

/** ArrayBuffer → base64. */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.byteLength === 0) return '';
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return window.btoa(binary);
}

/**
 * Подготовка параметров каталога к отправке.
 * - tags: массив → строка через запятую;
 * - date_filter=false → date_from/date_to не отправляются;
 * - невалидные даты заменяются значениями по умолчанию;
 * - public=null → параметр не отправляется;
 * - пустые sort/sort_direction → не отправляются;
 * - клиентский флаг date_filter на бэкенд НЕ уходит.
 */
export function prepareRequestParams(input: RequestParams): Record<string, string | number | boolean> {
  const output: Record<string, string | number | boolean> = {
    page: input.page,
    per_page: input.per_page,
    search: input.search,
  };

  if (input.tags.length > 0) {
    output.tags = input.tags.join(',');
  }

  if (input.date_filter) {
    const dateRegex = /\d{4}-\d{2}-\d{2}/;
    output.date_from = dateRegex.test(input.date_from) ? input.date_from : '1900-01-01';
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    output.date_to = dateRegex.test(input.date_to) ? input.date_to : formattedToday;
  }

  if (input.public !== null) {
    output.public = input.public;
  }

  if (input.sort) output.sort = input.sort;
  if (input.sort_direction) output.sort_direction = input.sort_direction;

  return output;
}
