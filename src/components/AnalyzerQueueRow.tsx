import { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Link,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAnalyzerFaceThumbnail,
  fetchAnalyzerFaces,
  fetchAnalyzerGeo,
  queryKeys,
} from '../api';
import { fileUrl, previewUrl } from '../utils/media';
import {
  KIND_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  analyzerErrorMessage,
  analyzerFilePath,
  isNotFound,
} from '../utils/analyzer';
import { formatDate } from '../utils/format';
import type { AnalyzerQueueItem } from '../types/analyzer';
import type { FileObject } from '../types/models';

const DETAIL_COLSPAN = 6;

interface AnalyzerQueueRowProps {
  serverId: string;
  item: AnalyzerQueueItem;
}

/** Строка очереди анализатора + лениво раскрывающиеся детали (лица/геотег). */
export default function AnalyzerQueueRow({ serverId, item }: AnalyzerQueueRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover onClick={() => setOpen((v) => !v)} sx={{ cursor: 'pointer' }}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {open ? (
              <KeyboardArrowUpIcon fontSize="small" />
            ) : (
              <KeyboardArrowDownIcon fontSize="small" />
            )}
            <span style={{ wordBreak: 'break-all' }}>{analyzerFilePath(item)}</span>
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <span>{KIND_LABELS[item.kind]}</span>
            {item.kind === 'faces' && item.faces_count != null && (
              <Chip size="small" label={`${item.faces_count} лиц`} />
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            size="small"
            color={STATUS_COLORS[item.status]}
            label={STATUS_LABELS[item.status]}
          />
        </TableCell>
        <TableCell>{item.attempts}</TableCell>
        <TableCell sx={{ wordBreak: 'break-word' }}>{item.error ?? ''}</TableCell>
        <TableCell>{formatDate(item.processed_at)}</TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={DETAIL_COLSPAN} sx={{ p: 0, borderBottom: 'none' }}>
          <Collapse in={open} unmountOnExit>
            <AnalyzerItemDetails serverId={serverId} item={item} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function AnalyzerItemDetails({ serverId, item }: AnalyzerQueueRowProps) {
  // Псевдо-FileObject для переиспользования существующих fileUrl/previewUrl:
  // - есть catalog_file_id → ветка «по id»;
  // - нет → ветка «по name» (storage_id + folder_path + filename).
  const pseudo: Pick<FileObject, 'name' | 'id'> = item.catalog_file_id
    ? { id: item.catalog_file_id }
    : { name: item.filename };
  const storage = item.catalog_file_id ? '' : item.storage_id;
  const preview = previewUrl(serverId, storage, pseudo, item.folder_path);
  const full = fileUrl(serverId, storage, pseudo, item.folder_path);

  return (
    <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
        {preview && (
          <img
            src={preview}
            alt={item.filename}
            style={{ maxWidth: 160, maxHeight: 100, objectFit: 'contain' }}
          />
        )}
        {full && (
          <Link href={full} target="_blank" rel="noreferrer">
            Открыть файл
          </Link>
        )}
      </Box>

      {item.kind === 'faces' ? (
        <FacesDetail serverId={serverId} scannedFileId={item.scanned_file_id} />
      ) : (
        <GeoDetail serverId={serverId} scannedFileId={item.scanned_file_id} />
      )}
    </Box>
  );
}

function FacesDetail({ serverId, scannedFileId }: { serverId: string; scannedFileId: number }) {
  const facesQuery = useQuery({
    queryKey: queryKeys.analyzerFaces(serverId, scannedFileId),
    queryFn: () => fetchAnalyzerFaces(serverId, scannedFileId),
  });

  if (facesQuery.isLoading) {
    return <CircularProgress size={16} />;
  }
  if (facesQuery.isError) {
    if (isNotFound(facesQuery.error)) {
      return (
        <Typography variant="body2" color="text.secondary">
          Лица не найдены.
        </Typography>
      );
    }
    return <Alert severity="warning">{analyzerErrorMessage(facesQuery.error)}</Alert>;
  }

  const faces = facesQuery.data ?? [];
  if (faces.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Лица не найдены.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Лица ({faces.length})
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {faces.map((face) => (
          <Box key={face.id} sx={{ textAlign: 'center', width: 64 }}>
            <FaceThumb serverId={serverId} faceId={face.id} />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={face.person_name ?? face.person_id ?? ''}
            >
              {face.person_name ?? (face.person_id ? 'без имени' : '—')}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function FaceThumb({ serverId, faceId }: { serverId: string; faceId: number }) {
  const thumbQuery = useQuery({
    queryKey: queryKeys.analyzerFaceThumbnail(serverId, faceId),
    queryFn: () => fetchAnalyzerFaceThumbnail(serverId, faceId),
  });

  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        mx: 'auto',
        bgcolor: 'action.hover',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {thumbQuery.isLoading ? (
        <CircularProgress size={14} />
      ) : thumbQuery.isError || !thumbQuery.data ? (
        <Typography variant="caption" color="text.secondary">
          —
        </Typography>
      ) : (
        <img
          src={thumbQuery.data}
          alt={`лицо ${faceId}`}
          style={{ width: 48, height: 48, objectFit: 'cover' }}
        />
      )}
    </Box>
  );
}

function GeoDetail({ serverId, scannedFileId }: { serverId: string; scannedFileId: number }) {
  const geoQuery = useQuery({
    queryKey: queryKeys.analyzerGeo(serverId, scannedFileId),
    queryFn: () => fetchAnalyzerGeo(serverId, scannedFileId),
  });

  if (geoQuery.isLoading) {
    return <CircularProgress size={16} />;
  }
  if (geoQuery.isError) {
    if (isNotFound(geoQuery.error)) {
      return (
        <Typography variant="body2" color="text.secondary">
          Геотег отсутствует.
        </Typography>
      );
    }
    return <Alert severity="warning">{analyzerErrorMessage(geoQuery.error)}</Alert>;
  }

  const geo = geoQuery.data;
  if (!geo) return null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Геотег
      </Typography>
      <Typography variant="body2">Широта: {geo.lat}</Typography>
      <Typography variant="body2">Долгота: {geo.lon}</Typography>
      {geo.alt != null && <Typography variant="body2">Высота: {geo.alt}</Typography>}
      <Typography variant="body2">Время: {formatDate(geo.taken_at)}</Typography>
      <Typography variant="body2">Источник: {geo.source}</Typography>
    </Box>
  );
}
