import { useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { fetchAnalyzerQueue, fetchAnalyzerStats, fetchServers, queryKeys } from '../api';
import { errorMessageFromResponse } from '../api/client';
import type { AnalyzerKind, AnalyzerStatus } from '../types/analyzer';
import AnalyzerSummary from '../components/AnalyzerSummary';
import AnalyzerQueueRow from '../components/AnalyzerQueueRow';
import PaginationBar from '../components/PaginationBar';
import { KIND_LABELS, STATUS_LABELS, analyzerErrorMessage } from '../utils/analyzer';

const LIMIT = 50;

const KIND_OPTIONS: Array<{ value: AnalyzerKind; label: string }> = [
  { value: 'faces', label: KIND_LABELS.faces },
  { value: 'geo', label: KIND_LABELS.geo },
];

const STATUS_OPTIONS: AnalyzerStatus[] = ['pending', 'processing', 'done', 'failed', 'skipped'];

export default function AnalyzerDetailPage() {
  const { server_id: serverId = '' } = useParams();

  const [kind, setKind] = useState<AnalyzerKind | ''>('');
  const [status, setStatus] = useState<AnalyzerStatus | ''>('');
  const [page, setPage] = useState(1);

  const offset = (page - 1) * LIMIT;

  const serversQuery = useQuery({ queryKey: queryKeys.servers, queryFn: fetchServers });
  const server = serversQuery.data?.find((s) => s.id === serverId);
  const hasAnalyzer = Boolean(server?.analyzer_url);

  const queueParams = {
    kind: kind || undefined,
    status: status || undefined,
    limit: LIMIT,
    offset,
  };

  const statsQuery = useQuery({
    queryKey: queryKeys.analyzerStats(serverId),
    queryFn: () => fetchAnalyzerStats(serverId),
    enabled: Boolean(serverId) && hasAnalyzer,
    refetchInterval: 5000,
  });

  const queueQuery = useQuery({
    queryKey: queryKeys.analyzerQueue(serverId, queueParams),
    queryFn: () => fetchAnalyzerQueue(serverId, queueParams),
    enabled: Boolean(serverId) && hasAnalyzer,
    refetchInterval: 5000,
  });

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

  if (!server) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Сервер не найден.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Анализатор: {server.name}
      </Typography>

      {!hasAnalyzer ? (
        <Alert severity="info">Анализатор не настроен на этом сервере</Alert>
      ) : (
        <>
          {statsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : statsQuery.isError ? (
            <Alert severity="warning">{analyzerErrorMessage(statsQuery.error)}</Alert>
          ) : statsQuery.data ? (
            <AnalyzerSummary stats={statsQuery.data} />
          ) : null}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Очередь
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="analyzer-kind-label">Вид</InputLabel>
                <Select
                  labelId="analyzer-kind-label"
                  label="Вид"
                  value={kind}
                  onChange={(event) => {
                    setKind(event.target.value as AnalyzerKind | '');
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Все</MenuItem>
                  {KIND_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="analyzer-status-label">Статус</InputLabel>
                <Select
                  labelId="analyzer-status-label"
                  label="Статус"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as AnalyzerStatus | '');
                    setPage(1);
                  }}
                >
                  <MenuItem value="">Все</MenuItem>
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {STATUS_LABELS[option]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {queueQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : queueQuery.isError ? (
              <Alert severity="warning">{analyzerErrorMessage(queueQuery.error)}</Alert>
            ) : queueQuery.data && queueQuery.data.items.length === 0 ? (
              <Typography color="text.secondary">Очередь пуста.</Typography>
            ) : queueQuery.data ? (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Файл</TableCell>
                        <TableCell>Вид</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Попытки</TableCell>
                        <TableCell>Ошибка</TableCell>
                        <TableCell>Обработан</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {queueQuery.data.items.map((item) => (
                        <AnalyzerQueueRow key={item.scanned_file_id} serverId={serverId} item={item} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <PaginationBar
                  page={page}
                  totalItems={queueQuery.data.total}
                  perPage={LIMIT}
                  onChange={setPage}
                />
              </>
            ) : null}
          </Box>
        </>
      )}
    </Box>
  );
}
