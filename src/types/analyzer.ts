// Типы для страниц статуса воркера s_media_analyzer.
// См. contracts/analyzer-worker-status.md, §5.2.

export type AnalyzerKind = 'faces' | 'geo';

export type AnalyzerStatus = 'pending' | 'processing' | 'done' | 'failed' | 'skipped';

export interface AnalyzerKindCounts {
  pending: number;
  processing: number;
  done: number;
  failed: number;
  skipped: number;
}

export interface AnalyzerProcessingItem {
  scanned_file_id: number;
  catalog_file_id: string | null;
  folder_path: string;
  filename: string;
  kind: AnalyzerKind;
  attempts: number;
  locked_at: string | null;
}

export interface AnalyzerStats {
  queue: Record<AnalyzerKind, AnalyzerKindCounts>;
  processing: AnalyzerProcessingItem[];
  scanned_files: number;
  faces_total: number;
  faces_unassigned: number;
  clusters_total: number;
  geo_total: number;
  analyzer_version: number;
}

export interface AnalyzerQueueItem {
  scanned_file_id: number;
  catalog_file_id: string | null;
  folder_path: string;
  filename: string;
  kind: AnalyzerKind;
  status: AnalyzerStatus;
  attempts: number;
  error: string | null;
  locked_at: string | null;
  processed_at: string | null;
  analyzer_version: number;
}

export interface AnalyzerQueuePage {
  items: AnalyzerQueueItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface AnalyzerQueueParams {
  kind?: AnalyzerKind;
  status?: AnalyzerStatus;
  limit?: number;
  offset?: number;
}
