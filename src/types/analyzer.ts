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
  storage_id: string;
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
  storage_id: string;
  folder_path: string;
  filename: string;
  kind: AnalyzerKind;
  status: AnalyzerStatus;
  attempts: number;
  error: string | null;
  locked_at: string | null;
  processed_at: string | null;
  analyzer_version: number;
  faces_count: number | null;
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

export type AnalyzerFaceStatus = 'auto' | 'confirmed' | 'rejected';

export interface AnalyzerFace {
  id: number;
  scanned_file_id: number;
  catalog_file_id: string | null;
  bbox: { x: number; y: number; w: number; h: number };
  det_score: number;
  cluster_id: number | null;
  person_id: string | null;
  person_name: string | null;
  match_score: number | null;
  status: AnalyzerFaceStatus;
  has_crop: boolean;
}

export type AnalyzerGeoSource = 'exif' | 'video' | 'manual';

export interface AnalyzerGeo {
  scanned_file_id: number;
  catalog_file_id: string | null;
  lat: number;
  lon: number;
  alt: number | null;
  taken_at: string | null;
  source: AnalyzerGeoSource;
}

/** Страница результатов с пагинацией offset/limit (аналог Page[T] анализатора). */
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface FaceCluster {
  id: number;
  size: number;
  person_id: string | null;
  person_name: string | null;
  ignored: boolean;
  sample_face_ids: number[];
}

export interface Person {
  person_id: string;
  names: string[];
}

export interface ClustersParams {
  unassigned?: boolean;
  ignored?: boolean;
  min_size?: number;
  limit?: number;
  offset?: number;
}

export interface PeopleParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CandidateCluster {
  cluster_id: number;
  size: number;
  sample_face_ids: number[];
  similarity: number;
}

export interface CandidatesParams {
  limit?: number;
  min_similarity?: number;
}
