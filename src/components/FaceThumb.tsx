import { Box, CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalyzerFaceThumbnail, queryKeys } from '../api';

interface FaceThumbProps {
  serverId: string;
  faceId: number;
  size?: number;
}

/** Миниатюра лица (грузится как dataURL через apiClient). */
export default function FaceThumb({ serverId, faceId, size = 48 }: FaceThumbProps) {
  const thumbQuery = useQuery({
    queryKey: queryKeys.analyzerFaceThumbnail(serverId, faceId),
    queryFn: () => fetchAnalyzerFaceThumbnail(serverId, faceId),
    staleTime: Infinity,
  });

  return (
    <Box
      sx={{
        width: size,
        height: size,
        bgcolor: 'action.hover',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {thumbQuery.isLoading ? (
        <CircularProgress size={Math.max(12, size / 3)} />
      ) : thumbQuery.isError || !thumbQuery.data ? (
        <Typography variant="caption" color="text.secondary">
          —
        </Typography>
      ) : (
        <img
          src={thumbQuery.data}
          alt={`лицо ${faceId}`}
          style={{ width: size, height: size, objectFit: 'cover' }}
        />
      )}
    </Box>
  );
}
