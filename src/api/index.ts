import axios from 'axios';
import apiClient from './client';
import { BASE_URL, arrayBufferToBase64, folderCollageUrl, prepareRequestParams } from '../utils/media';
import type {
  CatalogObject,
  FileObject,
  Folder,
  PaginationInfo,
  RequestParams,
  Server,
  Storage,
} from '../types/models';
import type {
  AnalyzerFace,
  AnalyzerGeo,
  AnalyzerQueuePage,
  AnalyzerQueueParams,
  AnalyzerStats,
  CandidateCluster,
  CandidatesParams,
  ClustersParams,
  FaceCluster,
  Page,
  PatchFaceBody,
  PeopleParams,
  PersonSummary,
} from '../types/analyzer';

// ---------------------------------------------------------------------------
// Аутентификация
// ---------------------------------------------------------------------------

export interface TokenPair {
  access: string;
  refresh: string;
}

export async function loginRequest(username: string, password: string): Promise<TokenPair> {
  const response = await axios.post<TokenPair>(`${BASE_URL}/api/token/`, { username, password });
  return response.data;
}

// ---------------------------------------------------------------------------
// Серверы
// ---------------------------------------------------------------------------

export async function fetchServers(): Promise<Server[]> {
  const response = await apiClient.get<{ results: Server[] }>('/servers/');
  // API отдаёт id числом (автоинкремент), а тип Server.id объявлен строкой — приводим.
  return response.data.results.map((s) => ({ ...s, id: String(s.id) }));
}

export async function createServer(data: { name: string; url: string }): Promise<void> {
  await apiClient.post('/servers/', data);
}

export async function updateServer(id: string, data: { name: string; url: string }): Promise<void> {
  await apiClient.patch(`/servers/${id}/`, data);
}

export async function deleteServer(id: string): Promise<void> {
  await apiClient.delete(`/servers/${id}/`);
}

// ---------------------------------------------------------------------------
// Хранилища
// ---------------------------------------------------------------------------

export async function fetchStorages(serverId?: string): Promise<Storage[]> {
  const response = await apiClient.get<{ results: Storage[] }>('/storages/', {
    params: serverId ? { server_id: serverId } : undefined,
  });
  return response.data.results;
}

export async function createStorage(data: {
  server_id: string;
  key: string;
  name: string;
  path: string;
}): Promise<void> {
  await apiClient.post('/storages/', data);
}

export async function updateStorage(
  id: string,
  data: { server_id: string; key: string; name: string; path: string },
): Promise<void> {
  await apiClient.patch(`/storages/${id}/`, data);
}

export async function deleteStorage(serverId: string, storageId: string): Promise<void> {
  await apiClient.delete(`/storages/${serverId}/${storageId}/`);
}

// ---------------------------------------------------------------------------
// Главная
// ---------------------------------------------------------------------------

export async function fetchMain(): Promise<CatalogObject[]> {
  try {
    const response = await apiClient.get<{ results: { files: CatalogObject[] } }>('/main/');
    return response.data.results.files ?? [];
  } catch (error) {
    // API возвращает 404 при отсутствии серверов/файлов — считаем это пустым списком.
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Содержимое хранилища
// ---------------------------------------------------------------------------

export interface FolderContentResponse {
  results: Folder;
  pagination: PaginationInfo;
}

export async function fetchFolderContent(
  server: string,
  storage: string,
  folderPath: string,
  page: number,
): Promise<FolderContentResponse> {
  const response = await apiClient.get<FolderContentResponse>(
    `/storage/${server}/${storage}/`,
    { params: { folder: folderPath, page } },
  );
  return response.data;
}

export async function fetchServersContent(): Promise<Folder[]> {
  const response = await apiClient.get<{ results: { folders: Folder[] } }>('/servers_content/');
  return response.data.results?.folders ?? [];
}

export async function fetchFolderCollage(server: string, storage: string, folder: string): Promise<string> {
  const url = folderCollageUrl(server, storage, folder);
  const response = await apiClient.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
  const base64 = arrayBufferToBase64(response.data);
  return base64 ? `data:image/jpeg;base64,${base64}` : '';
}

// ---------------------------------------------------------------------------
// Каталог
// ---------------------------------------------------------------------------

export interface CatalogContentResponse {
  files: FileObject[];
  pagination: PaginationInfo;
}

export async function fetchCatalogContent(
  serverId: string,
  storageId: string,
  params: RequestParams,
): Promise<CatalogContentResponse> {
  const prepared = prepareRequestParams(params);
  const response = await apiClient.get<CatalogContentResponse>(
    `/catalog_content/${serverId}/${storageId}/`,
    { params: prepared },
  );
  return response.data;
}

export async function fetchTags(serverId: string): Promise<string[]> {
  const response = await apiClient.get<{ results: string[] }>(`/catalog/tags/${serverId}/`);
  return response.data.results ?? [];
}

// ---------------------------------------------------------------------------
// Сохранение данных файла (описание / теги / публичность)
// ---------------------------------------------------------------------------

export type FileInfoPayload =
  | {
      id: string;
      note?: string;
      tags?: string[];
      is_public?: boolean;
      status?: 'active' | 'inactive';
    }
  | {
      folder_path: string;
      filename: string;
      note?: string;
      tags?: string[];
      is_public?: boolean;
      status?: 'active' | 'inactive';
    };

export async function saveFileInfo(
  server: string,
  storage: string,
  data: FileInfoPayload,
): Promise<void> {
  await apiClient.post(`/storage/fileinfo/${server}/${storage}/`, data);
}

// ---------------------------------------------------------------------------
// Анализатор (статус воркера)
// ---------------------------------------------------------------------------

export async function fetchAnalyzerStats(serverId: string): Promise<AnalyzerStats> {
  const response = await apiClient.get<AnalyzerStats>(`/analyzer/${serverId}/stats`);
  return response.data;
}

export async function fetchAnalyzerQueue(
  serverId: string,
  params: AnalyzerQueueParams = {},
): Promise<AnalyzerQueuePage> {
  const response = await apiClient.get<AnalyzerQueuePage>(`/analyzer/${serverId}/queue`, {
    params,
  });
  return response.data;
}

export async function fetchAnalyzerFaces(
  serverId: string,
  scannedFileId: number,
): Promise<AnalyzerFace[]> {
  const response = await apiClient.get<AnalyzerFace[]>(
    `/analyzer/${serverId}/scanned-files/${scannedFileId}/faces`,
  );
  return response.data;
}

export async function fetchAnalyzerGeo(
  serverId: string,
  scannedFileId: number,
): Promise<AnalyzerGeo> {
  const response = await apiClient.get<AnalyzerGeo>(
    `/analyzer/${serverId}/scanned-files/${scannedFileId}/geo`,
  );
  return response.data;
}

export async function fetchAnalyzerFaceThumbnail(
  serverId: string,
  faceId: number,
): Promise<string> {
  const response = await apiClient.get<ArrayBuffer>(
    `/analyzer/${serverId}/faces/${faceId}/thumbnail`,
    { responseType: 'arraybuffer' },
  );
  const base64 = arrayBufferToBase64(response.data);
  return base64 ? `data:image/jpeg;base64,${base64}` : '';
}

export async function fetchClusters(
  serverId: string,
  params: ClustersParams = {},
): Promise<Page<FaceCluster>> {
  const response = await apiClient.get<Page<FaceCluster>>(
    `/analyzer/${serverId}/clusters`,
    { params },
  );
  return response.data;
}

export async function fetchPeople(
  serverId: string,
  params: PeopleParams = {},
): Promise<Page<PersonSummary>> {
  const response = await apiClient.get<Page<PersonSummary>>(`/analyzer/${serverId}/people`, {
    params,
  });
  return response.data;
}

export async function fetchPersonFaces(
  serverId: string,
  personId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<Page<AnalyzerFace>> {
  const response = await apiClient.get<Page<AnalyzerFace>>(
    `/analyzer/${serverId}/people/${personId}/faces`,
    { params },
  );
  return response.data;
}

export async function fetchClusterFaces(
  serverId: string,
  clusterId: number,
  params: { limit?: number; offset?: number } = {},
): Promise<Page<AnalyzerFace>> {
  const response = await apiClient.get<Page<AnalyzerFace>>(
    `/analyzer/${serverId}/clusters/${clusterId}/faces`,
    { params },
  );
  return response.data;
}

export async function assignCluster(
  serverId: string,
  clusterId: number,
  body: { person_id: string; name: string; promote: boolean },
): Promise<void> {
  await apiClient.post(`/analyzer/${serverId}/clusters/${clusterId}/assign`, body);
}

export async function setClusterIgnored(
  serverId: string,
  clusterId: number,
  ignored: boolean,
): Promise<void> {
  const path = `/analyzer/${serverId}/clusters/${clusterId}/ignore`;
  if (ignored) {
    await apiClient.post(path);
  } else {
    await apiClient.delete(path);
  }
}

export async function fetchCandidates(
  serverId: string,
  personId: string,
  params: CandidatesParams = {},
): Promise<Page<CandidateCluster>> {
  const response = await apiClient.get<Page<CandidateCluster>>(
    `/analyzer/${serverId}/people/${personId}/candidates`,
    { params },
  );
  return response.data;
}

export async function rejectCluster(
  serverId: string,
  personId: string,
  clusterId: number,
): Promise<void> {
  await apiClient.post(
    `/analyzer/${serverId}/people/${personId}/reject-cluster/${clusterId}`,
  );
}

export async function patchFace(
  serverId: string,
  faceId: number,
  body: PatchFaceBody,
): Promise<void> {
  await apiClient.patch(`/analyzer/${serverId}/faces/${faceId}`, body);
}

export async function promoteCluster(
  serverId: string,
  clusterId: number,
  name: string,
): Promise<void> {
  await apiClient.post(`/analyzer/${serverId}/clusters/${clusterId}/promote`, { name });
}

export async function unpromoteCluster(
  serverId: string,
  clusterId: number,
): Promise<void> {
  await apiClient.post(`/analyzer/${serverId}/clusters/${clusterId}/unpromote`);
}

export async function promoteFace(
  serverId: string,
  faceId: number,
  name: string,
): Promise<void> {
  await apiClient.post(`/analyzer/${serverId}/faces/${faceId}/promote`, { name });
}

export async function unpromoteFace(serverId: string, faceId: number): Promise<void> {
  await apiClient.post(`/analyzer/${serverId}/faces/${faceId}/unpromote`);
}

// ---------------------------------------------------------------------------
// Ключи TanStack Query
// ---------------------------------------------------------------------------

export const queryKeys = {
  servers: ['servers'] as const,
  storages: (serverId?: string) => ['storages', serverId ?? 'all'] as const,
  main: ['main'] as const,
  serversContent: ['serversContent'] as const,
  folderContent: (server: string, storage: string, folderPath: string, page: number) =>
    ['folderContent', server, storage, folderPath, page] as const,
  folderCollage: (server: string, storage: string, folder: string) =>
    ['folderCollage', server, storage, folder] as const,
  catalogContent: (serverId: string, storageId: string, params: RequestParams) =>
    ['catalogContent', serverId, storageId, params] as const,
  tags: (serverId: string) => ['tags', serverId] as const,
  analyzerStats: (serverId: string) => ['analyzerStats', serverId] as const,
  analyzerQueue: (serverId: string, params: AnalyzerQueueParams) =>
    ['analyzerQueue', serverId, params] as const,
  analyzerFaces: (serverId: string, scannedFileId: number) =>
    ['analyzerFaces', serverId, scannedFileId] as const,
  analyzerGeo: (serverId: string, scannedFileId: number) =>
    ['analyzerGeo', serverId, scannedFileId] as const,
  analyzerFaceThumbnail: (serverId: string, faceId: number) =>
    ['analyzerFaceThumbnail', serverId, faceId] as const,
  clusters: (serverId: string, params: ClustersParams) =>
    ['clusters', serverId, params] as const,
  people: (serverId: string, params: PeopleParams) =>
    ['people', serverId, params] as const,
  personFaces: (serverId: string, personId: string, params: { limit?: number; offset?: number }) =>
    ['personFaces', serverId, personId, params] as const,
  clusterFaces: (serverId: string, clusterId: number, params: { limit?: number; offset?: number }) =>
    ['clusterFaces', serverId, clusterId, params] as const,
  candidates: (serverId: string, personId: string, params: CandidatesParams) =>
    ['candidates', serverId, personId, params] as const,
};
