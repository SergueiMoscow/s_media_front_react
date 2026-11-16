import { Box, Card, CardActionArea, CardContent, CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchFolderCollage, queryKeys } from '../api';
import { foldersImageUrl } from '../utils/media';
import type { Folder } from '../types/models';

interface FolderCardProps {
  folder: Folder;
  server: string;
  storage: string;
  parentPath?: string;
}

export default function FolderCard({ folder, server, storage, parentPath = '' }: FolderCardProps) {
  const navigate = useNavigate();

  const resolvedServer = folder.server_id ?? server;
  const resolvedStorage = folder.storage_id ?? storage;
  const folderPath =
    folder.path !== undefined
      ? folder.path
      : parentPath
        ? `${parentPath}/${folder.name}`
        : folder.name;

  const title = folder.name || folder.storage_name || '';
  const imageUrl = folder.image_url ?? foldersImageUrl(folder.folders_count.direct);

  const collageQuery = useQuery({
    queryKey: queryKeys.folderCollage(resolvedServer, resolvedStorage, folderPath),
    queryFn: () => fetchFolderCollage(resolvedServer, resolvedStorage, folderPath),
    enabled: Boolean(resolvedServer && resolvedStorage),
    staleTime: Infinity,
  });

  const handleClick = () => {
    const base = `/folder_content/${resolvedServer}/${resolvedStorage}`;
    navigate(folderPath ? `${base}/${folderPath}` : base);
  };

  return (
    <Card sx={{ width: 280 }}>
      <CardActionArea onClick={handleClick}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} noWrap title={title}>
            {title}
          </Typography>

          {(folder.storage_name || folder.server_name) && (
            <Typography variant="caption" color="text.secondary">
              {folder.storage_name}
              {folder.server_name ? ` (${folder.server_name})` : ''}
            </Typography>
          )}

          <Box sx={{ my: 1 }}>
            <img
              src={imageUrl}
              alt="folder"
              style={{ maxWidth: '100%', height: 60, objectFit: 'contain' }}
            />
          </Box>
          <Typography variant="caption">
            Папок: {folder.folders_count.direct}{' '}
            <Typography component="span" variant="caption" color="text.secondary">
              (всего {folder.folders_count.total})
            </Typography>
          </Typography>
        </CardContent>
      </CardActionArea>

      <CardContent sx={{ pt: 0, textAlign: 'center' }}>
        {collageQuery.isLoading && <CircularProgress size={16} />}
        {collageQuery.isSuccess && collageQuery.data ? (
          <img
            src={collageQuery.data}
            alt="collage"
            style={{
              maxWidth: '100%',
              maxHeight: 140,
              objectFit: 'contain',
              cursor: 'pointer',
              display: 'block',
              margin: '0 auto',
            }}
            onClick={handleClick}
          />
        ) : null}
        <Typography variant="caption">
          Файлов: {folder.files_count.direct}{' '}
          <Typography component="span" variant="caption" color="text.secondary">
            (всего {folder.files_count.total})
          </Typography>
        </Typography>
      </CardContent>
    </Card>
  );
}
