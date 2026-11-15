import axios from 'axios';
import { errorMessageFromResponse } from '../api/client';
import type { AnalyzerKind, AnalyzerStatus } from '../types/analyzer';

export const KIND_LABELS: Record<AnalyzerKind, string> = {
  faces: 'Лица',
  geo: 'Геометки',
};

export const STATUS_LABELS: Record<AnalyzerStatus, string> = {
  pending: 'В очереди',
  processing: 'Обрабатывается',
  done: 'Готово',
  failed: 'Ошибка',
  skipped: 'Пропущено',
};

export const STATUS_COLORS: Record<AnalyzerStatus, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  pending: 'default',
  processing: 'info',
  done: 'success',
  failed: 'error',
  skipped: 'warning',
};

/** Путь файла для отображения: `folder_path/filename` (без ведущего слэша). */
export function analyzerFilePath(item: { folder_path: string; filename: string }): string {
  return item.folder_path ? `${item.folder_path}/${item.filename}` : item.filename;
}

/** Человекопонятное сообщение об ошибке анализатора (404 = не настроен). */
export function analyzerErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return 'Анализатор не настроен на этом сервере';
  }
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;
  return errorMessageFromResponse(data) || 'Не удалось получить данные анализатора';
}

/** 404 от анализатора (например, «нет геотега»), а не «не настроен». */
export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
