import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { fetchClusterFaces, patchFace, queryKeys } from '../api';
import { errorMessageFromResponse } from '../api/client';
import { fileUrl, previewUrl } from '../utils/media';
import type { AnalyzerFace, AnalyzerFaceStatus, FaceCluster } from '../types/analyzer';
import type { FileObject } from '../types/models';
import FaceThumb from './FaceThumb';
import NameClusterDialog, { type AssignBody } from './NameClusterDialog';
import PaginationBar from './PaginationBar';
import { useToast } from './ToastContext';

const PAGE_SIZE = 24;

type UrlBuilder = (
  server: string,
  storage: string,
  file: Pick<FileObject, 'name' | 'id'>,
  folderPath?: string,
) => string;

function faceUrl(builder: UrlBuilder, serverId: string, face: AnalyzerFace): string {
  if (face.catalog_file_id) {
    return builder(serverId, '', { id: face.catalog_file_id }, '');
  }
  if (face.storage_id && face.filename) {
    return builder(serverId, face.storage_id, { name: face.filename }, face.folder_path ?? '');
  }
  return '';
}

interface ClusterFacesDialogProps {
  serverId: string;
  cluster: FaceCluster;
  onClustersChanged: () => void;
  onClose: () => void;
}

/** Просмотр лиц кластера: статусы, пометка «✓/✗», именование выбранных, просмотр фото. */
export default function ClusterFacesDialog({
  serverId,
  cluster,
  onClustersChanged,
  onClose,
}: ClusterFacesDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [selectedFaceIds, setSelectedFaceIds] = useState<number[]>([]);
  const [namingOpen, setNamingOpen] = useState(false);
  const [namingLoading, setNamingLoading] = useState(false);
  const [photoFace, setPhotoFace] = useState<AnalyzerFace | null>(null);

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clusterFaces', serverId, cluster.id] });
    onClustersChanged();
  };

  const handleError = (error: unknown, fallback: string) => {
    const data = axios.isAxiosError(error) ? error.response?.data : undefined;
    showToast(errorMessageFromResponse(data) || fallback, 'error');
  };

  const handleStatus = async (face: AnalyzerFace, status: AnalyzerFaceStatus) => {
    try {
      await patchFace(serverId, face.id, { status });
      invalidate();
    } catch (error) {
      handleError(error, 'Ошибка');
    }
  };

  const handleUnassign = async (face: AnalyzerFace) => {
    try {
      await patchFace(serverId, face.id, { unassign: true });
      invalidate();
    } catch (error) {
      handleError(error, 'Ошибка');
    }
  };

  const toggleFace = (faceId: number) => {
    setSelectedFaceIds((prev) =>
      prev.includes(faceId) ? prev.filter((id) => id !== faceId) : [...prev, faceId],
    );
  };

  const handleNameSelected = async (body: AssignBody) => {
    if (selectedFaceIds.length === 0) return;
    setNamingLoading(true);
    try {
      await Promise.all(
        selectedFaceIds.map((faceId) =>
          patchFace(serverId, faceId, { person_id: body.person_id }),
        ),
      );
      setSelectedFaceIds([]);
      setNamingOpen(false);
      invalidate();
      showToast('Имя назначено', 'success');
    } catch (error) {
      handleError(error, 'Ошибка именования');
    } finally {
      setNamingLoading(false);
    }
  };

  const total = facesQuery.data?.total ?? 0;
  const faces = facesQuery.data?.items ?? [];

  return (
    <>
      <Dialog open onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {cluster.person_name ?? 'Без имени'} — {cluster.size} лиц
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button
              variant="contained"
              disabled={selectedFaceIds.length === 0}
              onClick={() => setNamingOpen(true)}
            >
              Назвать выбранные ({selectedFaceIds.length})
            </Button>
          </Box>

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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {faces.map((face) => (
                  <Box
                    key={face.id}
                    sx={{
                      width: 140,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.25,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        minHeight: 24,
                      }}
                    >
                      <Checkbox
                        size="small"
                        sx={{ p: 0 }}
                        checked={selectedFaceIds.includes(face.id)}
                        onChange={() => toggleFace(face.id)}
                      />
                      {face.status === 'confirmed' && (
                        <Chip size="small" color="success" label="подтверждено" />
                      )}
                      {face.status === 'rejected' && (
                        <Chip size="small" color="error" label="отклонено" />
                      )}
                    </Box>

                    <Box
                      onClick={() => setPhotoFace(face)}
                      sx={{ cursor: 'pointer' }}
                      title="Открыть фото"
                    >
                      <FaceThumb serverId={serverId} faceId={face.id} size={72} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        color="success"
                        aria-label="Подтвердить"
                        onClick={() => handleStatus(face, 'confirmed')}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label="Отклонить"
                        onClick={() => handleStatus(face, 'rejected')}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {face.person_id && (
                      <Button
                        size="small"
                        onClick={() => handleUnassign(face)}
                        sx={{ minWidth: 0, fontSize: '0.7rem' }}
                      >
                        снять имя
                      </Button>
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

      {namingOpen && (
        <NameClusterDialog
          serverId={serverId}
          loading={namingLoading}
          onSubmit={handleNameSelected}
          onClose={() => setNamingOpen(false)}
        />
      )}

      <Dialog
        open={Boolean(photoFace)}
        onClose={() => setPhotoFace(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          {photoFace && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={faceUrl(previewUrl, serverId, photoFace)}
                alt="фото"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoFace(null)} color="inherit">
            Закрыть
          </Button>
          {photoFace && (
            <Button
              component="a"
              href={faceUrl(fileUrl, serverId, photoFace)}
              target="_blank"
              rel="noreferrer"
            >
              Оригинал
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
