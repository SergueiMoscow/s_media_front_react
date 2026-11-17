import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  assignCluster,
  fetchClusters,
  fetchServers,
  promoteCluster,
  queryKeys,
  setClusterIgnored,
  unpromoteCluster,
} from '../api';
import { errorMessageFromResponse } from '../api/client';
import type { ClustersParams, FaceCluster } from '../types/analyzer';
import LazyFaceThumb from '../components/LazyFaceThumb';
import NameClusterDialog, { type AssignBody } from '../components/NameClusterDialog';
import ClusterFacesDialog from '../components/ClusterFacesDialog';
import CandidatesDialog from '../components/CandidatesDialog';
import EmptyState from '../components/EmptyState';
import PaginationBar from '../components/PaginationBar';
import { useToast } from '../components/ToastContext';
import { analyzerErrorMessage } from '../utils/analyzer';

const LIMIT = 24;

type StatusFilter = 'all' | 'unassigned' | 'named' | 'ignored';

export default function FacesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedServerId, setSelectedServerId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [minSize, setMinSize] = useState(2);
  const [page, setPage] = useState(1);
  const [nameTarget, setNameTarget] = useState<FaceCluster | null>(null);
  const [viewTarget, setViewTarget] = useState<FaceCluster | null>(null);
  const [candidatesTarget, setCandidatesTarget] = useState<FaceCluster | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const serversQuery = useQuery({ queryKey: queryKeys.servers, queryFn: fetchServers });

  const analyzerServers = (serversQuery.data ?? []).filter((s) => Boolean(s.analyzer_url));
  // Эффективный выбранный сервер: если выбранного нет в списке — берём первый.
  const serverId = analyzerServers.some((s) => s.id === selectedServerId)
    ? selectedServerId
    : analyzerServers[0]?.id ?? '';

  const clustersParams: ClustersParams = {
    unassigned:
      statusFilter === 'unassigned' ? true : statusFilter === 'named' ? false : undefined,
    ignored: statusFilter === 'ignored' ? true : undefined,
    min_size: minSize,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  };

  const clustersQuery = useQuery({
    queryKey: queryKeys.clusters(serverId, clustersParams),
    queryFn: () => fetchClusters(serverId, clustersParams),
    enabled: Boolean(serverId),
  });

  const invalidateClusters = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.clusters(serverId, clustersParams),
    });
  };

  const handleAssign = async (body: AssignBody) => {
    if (!nameTarget) return;
    setAssignLoading(true);
    try {
      await assignCluster(serverId, nameTarget.id, body);
      setNameTarget(null);
      invalidateClusters();
      showToast('Кластер назван', 'success');
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      showToast(errorMessageFromResponse(data) || 'Ошибка именования', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleToggleIgnore = async (cluster: FaceCluster) => {
    try {
      await setClusterIgnored(serverId, cluster.id, !cluster.ignored);
      invalidateClusters();
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      showToast(errorMessageFromResponse(data) || 'Ошибка', 'error');
    }
  };

  const handlePromoteCluster = async (cluster: FaceCluster) => {
    try {
      await promoteCluster(serverId, cluster.id, cluster.person_name ?? '');
      invalidateClusters();
      showToast('Добавлено в каталог', 'success');
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      showToast(errorMessageFromResponse(data) || 'Ошибка', 'error');
    }
  };

  const handleUnpromoteCluster = async (cluster: FaceCluster) => {
    try {
      await unpromoteCluster(serverId, cluster.id);
      invalidateClusters();
      showToast('Убрано из каталога', 'success');
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      showToast(errorMessageFromResponse(data) || 'Ошибка', 'error');
    }
  };

  if (serversQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (serversQuery.isError) {
    const data = axios.isAxiosError(serversQuery.error)
      ? serversQuery.error.response?.data
      : undefined;
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{errorMessageFromResponse(data)}</Alert>
      </Box>
    );
  }

  if (analyzerServers.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <EmptyState message="Нет серверов с настроенным анализатором." />
      </Box>
    );
  }

  const clusters = clustersQuery.data?.items ?? [];
  const total = clustersQuery.data?.total ?? 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Лица
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="faces-server-label">Сервер</InputLabel>
          <Select
            labelId="faces-server-label"
            label="Сервер"
            value={serverId}
            onChange={(event) => {
              setSelectedServerId(event.target.value);
              setPage(1);
            }}
          >
            {analyzerServers.map((server) => (
              <MenuItem key={server.id} value={server.id}>
                {server.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="faces-status-label">Статус</InputLabel>
          <Select
            labelId="faces-status-label"
            label="Статус"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="unassigned">Без имени</MenuItem>
            <MenuItem value="named">С именем</MenuItem>
            <MenuItem value="ignored">Игнорируемые</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="number"
          label="Мин. размер"
          value={minSize}
          onChange={(event) => {
            setMinSize(Math.max(1, Number(event.target.value) || 2));
            setPage(1);
          }}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
          sx={{ width: 140 }}
        />
      </Stack>

      {clustersQuery.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : clustersQuery.isError ? (
        <Alert severity="warning">{analyzerErrorMessage(clustersQuery.error)}</Alert>
      ) : clusters.length === 0 ? (
        <EmptyState message="Кластеров нет." />
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {clusters.map((cluster) => (
              <Card key={cluster.id} sx={{ width: 200 }}>
                <CardActionArea onClick={() => setViewTarget(cluster)}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                    {cluster.sample_face_ids[0] != null ? (
                      <LazyFaceThumb
                        serverId={serverId}
                        faceId={cluster.sample_face_ids[0]}
                        size={96}
                      />
                    ) : (
                      <Box
                        sx={{ width: 96, height: 96, bgcolor: 'action.hover', borderRadius: 1 }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ pt: 1 }}>
                    <Typography variant="body1" noWrap title={cluster.person_name ?? ''}>
                      {cluster.person_name ?? 'Без имени'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cluster.size} лиц
                    </Typography>
                    {cluster.ignored && (
                      <Box sx={{ mt: 0.5 }}>
                        <Chip size="small" color="warning" label="игнорируется" />
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Button size="small" onClick={() => setNameTarget(cluster)}>
                    Назвать
                  </Button>
                  {cluster.person_id && (
                    <Button size="small" onClick={() => setCandidatesTarget(cluster)}>
                      Похожие
                    </Button>
                  )}
                  <Button
                    size="small"
                    color={cluster.ignored ? 'primary' : 'inherit'}
                    onClick={() => handleToggleIgnore(cluster)}
                  >
                    {cluster.ignored ? 'Вернуть' : 'Игнорировать'}
                  </Button>
                  {cluster.person_name && (
                    <Button size="small" onClick={() => handlePromoteCluster(cluster)}>
                      Добавить все в каталог
                    </Button>
                  )}
                  <Button size="small" onClick={() => handleUnpromoteCluster(cluster)}>
                    Убрать из каталога
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>

          <PaginationBar page={page} totalItems={total} perPage={LIMIT} onChange={setPage} />
        </>
      )}

      {nameTarget && (
        <NameClusterDialog
          serverId={serverId}
          loading={assignLoading}
          onSubmit={handleAssign}
          onClose={() => setNameTarget(null)}
        />
      )}

      {viewTarget && (
        <ClusterFacesDialog
          serverId={serverId}
          cluster={viewTarget}
          onClustersChanged={invalidateClusters}
          onClose={() => setViewTarget(null)}
        />
      )}

      {candidatesTarget && candidatesTarget.person_id && (
        <CandidatesDialog
          serverId={serverId}
          personId={candidatesTarget.person_id}
          personName={candidatesTarget.person_name ?? ''}
          onClustersChanged={invalidateClusters}
          onClose={() => setCandidatesTarget(null)}
        />
      )}
    </Box>
  );
}
