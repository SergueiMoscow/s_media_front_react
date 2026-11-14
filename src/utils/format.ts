function zeroPad(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/** ISO-строка → локальное время `ДД.ММ.ГГГГ ЧЧ:ММ`. */
export function formatDate(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const day = zeroPad(date.getDate());
  const month = zeroPad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = zeroPad(date.getHours());
  const minutes = zeroPad(date.getMinutes());
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/** Размер в байтах → строка в КБ (как в старом приложении). */
export function formatSize(size?: number | null): string {
  if (size == null || Number.isNaN(size)) return '';
  return `${(size / 1024).toFixed(2)} KB`;
}

/** Дата файла: предпочитаем created_at (каталог), затем created (хранилище). */
export function fileDate(file: { created_at?: string | null; created?: string | null }): string {
  return formatDate(file.created_at ?? file.created);
}
