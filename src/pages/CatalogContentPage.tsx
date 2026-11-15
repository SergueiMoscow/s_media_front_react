import { useMemo, useState } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { fetchCatalogContent, fetchTags, queryKeys } from '../api';
import { errorMessageFromResponse } from '../api/client';
import { isImageType } from '../utils/media';
import { defaultCatalogRequest, type FileObject, type RequestParams } from '../types/models';
import FileCard from '../components/FileCard';
import FilterPanel from '../components/FilterPanel';
import PaginationBar from '../components/PaginationBar';
import Lightbox from '../components/Lightbox';
import EmptyState from '../components/EmptyState';

export default function CatalogContentPage() {
  const { server_id: serverId = '', storage_id: storageId = '' } = useParams();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<RequestParams>(() => defaultCatalogRequest());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const catalogQuery = useQuery({
    queryKey: queryKeys.catalogContent(serverId, storageId, filter),
    queryFn: () => fetchCatalogContent(serverId, storageId, filter),
    enabled: Boolean(serverId && storageId),
  });

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags(serverId),
    queryFn: () => fetchTags(serverId),
    enabled: Boolean(serverId),
  });

  const imageFiles = useMemo(() => {
    if (!catalogQuery.data) return [];
    return (catalogQuery.data.files ?? []).filter((file) => isImageType(file.type));
  }, [catalogQuery.data]);

  const openLightbox = (file: FileObject) => {
    const index = imageFiles.findIndex((f) => f.id === file.id || f === file);
    if (index !== -1) setLightboxIndex(index);
  };

  const handleTagClick = (tag: string) => {
    const index = filter.tags.indexOf(tag);
    const nextTags = index === -1 ? [...filter.tags, tag] : filter.tags.filter((t) => t !== tag);
    setFilter((prev) => ({ ...prev, tags: nextTags, page: 1 }));
  };

  const invalidateContent = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.catalogContent(serverId, storageId, filter) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tags(serverId) });
  };

  if (!serverId || !storageId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Не указаны сервер или хранилище.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <FilterPanel filter={filter} allTags={tagsQuery.data ?? []} onChange={setFilter} />

      {catalogQuery.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {catalogQuery.isError && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            {errorMessageFromResponse(
              axios.isAxiosError(catalogQuery.error) ? catalogQuery.error.response?.data : undefined,
            )}
          </Alert>
        </Box>
      )}

      {catalogQuery.isSuccess && (
        <>
          {catalogQuery.data.files.length === 0 ? (
            <EmptyState message="Ничего не найдено." />
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {catalogQuery.data.files.map((file) => (
                <FileCard
                  key={file.id ?? `${file.name ?? ''}`}
                  file={file}
                  server={serverId}
                  storage={storageId}
                  folderPath=""
                  allTags={tagsQuery.data ?? []}
                  onTagClick={handleTagClick}
                  onImageClick={openLightbox}
                  onChanged={invalidateContent}
                />
              ))}
            </Box>
          )}

          <PaginationBar
            page={catalogQuery.data.pagination.page}
            totalItems={catalogQuery.data.pagination.items}
            perPage={catalogQuery.data.pagination.per_page || filter.per_page}
            onChange={(page) => setFilter((prev) => ({ ...prev, page }))}
          />
        </>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          open={lightboxIndex !== null}
          files={imageFiles}
          index={lightboxIndex}
          server={serverId}
          storage={storageId}
          folderPath=""
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </Box>
  );
}
