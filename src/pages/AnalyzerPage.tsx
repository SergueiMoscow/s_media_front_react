import { Alert, Box, Card, CardActionArea, CardContent, CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { fetchAnalyzerStats, fetchServers, queryKeys } from '../api';
import { errorMessageFromResponse } from '../api/client';
import type { Server } from '../types/models';
import AnalyzerSummary from '../components/AnalyzerSummary';
import EmptyState from '../components/EmptyState';
import { analyzerErrorMessage } from '../utils/analyzer';

function ServerCard({ server, onOpen }: { server: Server; onOpen: () => void }) {
  const hasAnalyzer = Boolean(server.analyzer_url);
  const statsQuery = useQuery({
    queryKey: queryKeys.analyzerStats(server.id),
    queryFn: () => fetchAnalyzerStats(server.id),
    enabled: hasAnalyzer,
    refetchInterval: 5000,
  });

  return (
    <Card>
      <CardActionArea onClick={onOpen}>
        <CardContent>
          <Typography variant="h6">{server.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {server.url}
          </Typography>

          {!hasAnalyzer ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              Анализатор не настроен
            </Alert>
          ) : statsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : statsQuery.isError ? (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {analyzerErrorMessage(statsQuery.error)}
            </Alert>
          ) : statsQuery.data ? (
            <Box sx={{ mt: 1 }}>
              <AnalyzerSummary stats={statsQuery.data} />
            </Box>
          ) : null}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function AnalyzerPage() {
  const navigate = useNavigate();
  const serversQuery = useQuery({ queryKey: queryKeys.servers, queryFn: fetchServers });

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

  const servers = serversQuery.data ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Анализатор
      </Typography>

      {servers.length === 0 ? (
        <EmptyState message="Нет серверов." />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onOpen={() => navigate(`/analyzer/${server.id}`)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
