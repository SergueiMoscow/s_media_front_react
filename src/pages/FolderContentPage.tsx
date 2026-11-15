import { useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { fetchFolderContent, fetchServersContent, fetchTags, queryKeys } from '../api';
import { errorMessageFromResponse } from '../api/client';
import { isImageType } from '../utils/media';
import type { FileObject } from '../types/models';
import FolderCard from '../components/FolderCard';
import FileCard from '../components/FileCard';
import FolderBreadcrumbs from '../components/FolderBreadcrumbs';
import PaginationBar from '../components/PaginationBar';
import Lightbox from '../components/Lightbox';
import EmptyState from '../components/EmptyState';

const PAGE_SIZE = 20;

export default function FolderContentPage() {
  const params = useParams<{ server?: string; storage?: string; '*': string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const server = params.server ?? '';
  const storage = params.storage ?? '';
  const folderPath = params['*'] ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  const isSummary = !server || !storage;

  const serversContentQuery = useQuery({
    queryKey: queryKeys.serversContent,
    queryFn: fetchServersContent,
    enabled: isSummary,
  });

  const folderContentQuery = useQuery({
    queryKey: queryKeys.folderContent(server, storage, folderPath, page),
    queryFn: () => fetchFolderContent(server, storage, folderPath, page),
    enabled: !isSummary,
  });

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags(server),
    queryFn: () => fetchTags(server),
    enabled: !isSummary && Boolean(server),
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const invalidateContent = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.folderContent(server, storage, folderPath, page) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tags(server) });
  };

  const imageFiles = useMemo(() => {
    if (isSummary || !folderContentQuery.data) return [];
    return (folderContentQuery.data.results.files ?? []).filter((file) => isImageType(file.type));
  }, [folderContentQuery.data, isSummary]);

  const openLightbox = (file: FileObject) => {
    const index = imageFiles.findIndex((f) => f === file);
    if (index !== -1) setLightboxIndex(index);
  };

  const changePage = (newPage: number) => {
    const base = `/folder_content/${server}/${storage}`;
    navigate(folderPath ? `${base}/${folderPath}?page=${newPage}` : `${base}?page=${newPage}`);
  };

  if (isSummary) {
    const folders = serversContentQuery.data ?? [];
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Хранилища
        </Typography>
        {serversContentQuery.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {serversContentQuery.isError && (
          <Alert severity="error">
            {errorMessageFromResponse(
              axios.isAxiosError(serversContentQuery.error)
                ? serversContentQuery.error.response?.data
                : undefined,
            )}
          </Alert>
        )}
        {!serversContentQuery.isLoading && folders.length === 0 && (
          <EmptyState message="Нет хранилищ." />
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {folders.map((folder) => (
            <FolderCard key={`${folder.server_id}-${folder.storage_id}`} folder={folder} server="" storage="" />
          ))}
        </Box>
      </Box>
    );
  }

  if (folderContentQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (folderContentQuery.isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {errorMessageFromResponse(
            axios.isAxiosError(folderContentQuery.error)
              ? folderContentQuery.error.response?.data
              : undefined,
          )}
        </Alert>
      </Box>
    );
  }

  const data = folderContentQuery.data;
  if (!data) return null;

  const folders = data.results.folders ?? [];
  const files = data.results.files ?? [];
  const storageName = data.results.storage_name ?? '';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Хранилище: {storageName}</Typography>
        <FolderBreadcrumbs server={server} storage={storage} folderPath={folderPath} />
      </Box>

      {folders.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {folders.map((folder) => (
            <FolderCard
              key={`${folder.server_id}-${folder.storage_id}-${folder.name}`}
              folder={folder}
              server={server}
              storage={storage}
              parentPath={folderPath}
            />
          ))}
        </Box>
      )}

      {files.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {files.map((file) => (
            <FileCard
              key={`${file.name ?? ''}${file.id ?? ''}`}
              file={file}
              server={server}
              storage={storage}
              folderPath={folderPath}
              allTags={tagsQuery.data ?? []}
              onImageClick={openLightbox}
              onChanged={invalidateContent}
            />
          ))}
        </Box>
      )}

      {folders.length === 0 && files.length === 0 && (
        <EmptyState message="Папка пуста." />
      )}

      <PaginationBar
        page={data.pagination.page}
        totalItems={data.pagination.items}
        perPage={PAGE_SIZE}
        onChange={changePage}
      />

      {lightboxIndex !== null && (
        <Lightbox
          open={lightboxIndex !== null}
          files={imageFiles}
          index={lightboxIndex}
          server={server}
          storage={storage}
          folderPath={folderPath}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </Box>
  );
}
