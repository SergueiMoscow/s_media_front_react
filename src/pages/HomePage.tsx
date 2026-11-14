import { Alert, Box, Card, CardContent, Chip, CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchMain, queryKeys } from '../api';
import { errorMessageFromResponse } from '../api/client';
import { formatDate, formatSize } from '../utils/format';
import { catalogPreviewUrl } from '../utils/media';

export default function HomePage() {
  const mainQuery = useQuery({
    queryKey: queryKeys.main,
    queryFn: fetchMain,
  });

  if (mainQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (mainQuery.isError) {
    const data = mainQuery.error && typeof mainQuery.error === 'object'
      ? (mainQuery.error as { response?: { data?: unknown } }).response?.data
      : undefined;
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{errorMessageFromResponse(data)}</Alert>
      </Box>
    );
  }

  const files = mainQuery.data ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Каталогизатор систем хранения изображений.
      </Typography>

      {files.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ py: 6 }}>
          Нет файлов в каталоге.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {files.map((file) => (
            <Card key={file.id} sx={{ width: 300 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#fafafa', minHeight: 160 }}>
                <img
                  src={catalogPreviewUrl(file.server_id ?? '', file.id)}
                  alt={file.note ?? ''}
                  loading="lazy"
                  style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }}
                />
              </Box>
              <CardContent>
                {file.note && (
                  <Typography variant="body1" align="center" sx={{ mb: 1 }}>
                    {file.note}
                  </Typography>
                )}
                {file.tags && file.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 1 }}>
                    {file.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'text.secondary' }}>
                  <span>
                    {file.type} - {formatSize(file.size)}
                  </span>
                  <span>{formatDate(file.created_at)}</span>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
