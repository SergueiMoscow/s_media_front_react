import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  assignCluster,
  fetchCandidates,
  queryKeys,
  rejectCluster,
  setClusterIgnored,
} from '../api';
import { errorMessageFromResponse } from '../api/client';
import type { CandidateCluster } from '../types/analyzer';
import FaceThumb from './FaceThumb';
import NameClusterDialog, { type AssignBody } from './NameClusterDialog';
import EmptyState from './EmptyState';
import { useToast } from './ToastContext';

interface CandidatesDialogProps {
  serverId: string;
  personId: string;
  personName: string;
  onClustersChanged: () => void;
  onClose: () => void;
}

/** Поиск похожих кластеров для человека + действия «тот же / нет / другой / игнорировать». */
export default function CandidatesDialog({
  serverId,
  personId,
  personName,
  onClustersChanged,
  onClose,
}: CandidatesDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [reassignTarget, setReassignTarget] = useState<CandidateCluster | null>(null);

  const candidatesQuery = useQuery({
    queryKey: queryKeys.candidates(serverId, personId, {}),
    queryFn: () => fetchCandidates(serverId, personId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.candidates(serverId, personId, {}) });
    onClustersChanged();
  };

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      await action();
      refresh();
      showToast(successMessage, 'success');
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      showToast(errorMessageFromResponse(data) || 'Ошибка', 'error');
    }
  };

  const handleSame = (candidate: CandidateCluster) => {
    void runAction(
      () =>
        assignCluster(serverId, candidate.cluster_id, {
          person_id: personId,
          name: personName,
          promote: false,
        }),
      'Кластер назначен',
    );
  };

  const handleReject = (candidate: CandidateCluster) => {
    void runAction(
      () => rejectCluster(serverId, personId, candidate.cluster_id),
      'Кластер отклонён',
    );
  };

  const handleIgnore = (candidate: CandidateCluster) => {
    void runAction(
      () => setClusterIgnored(serverId, candidate.cluster_id, true),
      'Кластер игнорируется',
    );
  };

  const handleReassignSubmit = async (body: AssignBody) => {
    if (!reassignTarget) return;
    await runAction(
      () => assignCluster(serverId, reassignTarget.cluster_id, body),
      'Кластер назначен',
    );
    setReassignTarget(null);
  };

  return (
    <>
      <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Похожие на «{personName || 'Без имени'}»</DialogTitle>
        <DialogContent>
          {candidatesQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : candidatesQuery.isError ? (
            <Typography color="text.secondary">Не удалось загрузить кандидатов.</Typography>
          ) : (candidatesQuery.data?.items.length ?? 0) === 0 ? (
            <EmptyState message="Похожие кластеры не найдены." />
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {candidatesQuery.data!.items.map((candidate) => (
                <Paper key={candidate.cluster_id} variant="outlined" sx={{ p: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {candidate.sample_face_ids[0] != null ? (
                      <FaceThumb
                        serverId={serverId}
                        faceId={candidate.sample_face_ids[0]}
                        size={56}
                      />
                    ) : (
                      <Box
                        sx={{ width: 56, height: 56, bgcolor: 'action.hover', borderRadius: 1 }}
                      />
                    )}
                    <Box sx={{ minWidth: 96 }}>
                      <Typography variant="body2">
                        {Math.round(candidate.similarity * 100)}% совпадение
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {candidate.size} лиц
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" onClick={() => handleSame(candidate)}>
                        Тот же
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => handleReject(candidate)}>
                        Нет
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setReassignTarget(candidate)}
                      >
                        Другой
                      </Button>
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => handleIgnore(candidate)}
                      >
                        Игнорировать
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {reassignTarget && (
        <NameClusterDialog
          serverId={serverId}
          onSubmit={handleReassignSubmit}
          onClose={() => setReassignTarget(null)}
        />
      )}
    </>
  );
}
