import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchClusterFaces, queryKeys } from '../api';
import { catalogPreviewUrl } from '../utils/media';
import type { FaceCluster } from '../types/analyzer';
import FaceThumb from './FaceThumb';
import PaginationBar from './PaginationBar';

const PAGE_SIZE = 24;

interface ClusterFacesDialogProps {
  serverId: string;
  cluster: FaceCluster;
  onClose: () => void;
}

/** Просмотр лиц кластера постранично (миниатюры + ссылка на фото при наличии catalog_file_id). */
export default function ClusterFacesDialog({
  serverId,
  cluster,
  onClose,
}: ClusterFacesDialogProps) {
  const [page, setPage] = useState(1);

  const facesQuery = useQuery({
    queryKey: queryKeys.clusterFaces(serverId, cluster.id, {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    queryFn: () =>
      fetchClusterFaces(serverId, cluster.id, {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const total = facesQuery.data?.total ?? 0;
  const faces = facesQuery.data?.items ?? [];

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {cluster.person_name ?? 'Без имени'} — {cluster.size} лиц
      </DialogTitle>
      <DialogContent>
        {facesQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : facesQuery.isError ? (
          <Typography color="text.secondary">Не удалось загрузить лица.</Typography>
        ) : faces.length === 0 ? (
          <Typography color="text.secondary">Лиц нет.</Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {faces.map((face) => (
                <Box key={face.id} sx={{ textAlign: 'center', width: 96 }}>
                  <FaceThumb serverId={serverId} faceId={face.id} size={72} />
                  {face.catalog_file_id ? (
                    <Link
                      href={catalogPreviewUrl(serverId, face.catalog_file_id)}
                      target="_blank"
                      rel="noreferrer"
                      variant="caption"
                    >
                      Фото
                    </Link>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            <PaginationBar page={page} totalItems={total} perPage={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
}
