import { useCallback, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { saveFileInfo, type FileInfoPayload } from '../api';
import { errorMessageFromResponse } from '../api/client';
import { fileDate, formatSize } from '../utils/format';
import { fileUrl, isImageType, isVideoType, previewUrl } from '../utils/media';
import type { FileObject } from '../types/models';
import EditableNote from './EditableNote';
import TagMultiselect from './TagMultiselect';
import { useToast } from './ToastContext';

interface FileCardProps {
  file: FileObject;
  server: string;
  storage: string;
  folderPath?: string;
  allTags?: string[];
  onTagClick?: (tag: string) => void;
  onImageClick?: (file: FileObject) => void;
  onChanged?: () => void;
}

export default function FileCard({
  file,
  server,
  storage,
  folderPath = '',
  allTags = [],
  onTagClick,
  onImageClick,
  onChanged,
}: FileCardProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const preview = previewUrl(server, storage, file, folderPath);
  const fullFileUrl = fileUrl(server, storage, file, folderPath);
  const image = isImageType(file.type);
  const video = isVideoType(file.type);
  const tags = file.tags ?? [];

  const save = useCallback(
    async (patch: { note?: string; tags?: string[]; is_public?: boolean }) => {
      let payload: FileInfoPayload;
      if (file.name) {
        payload = { folder_path: folderPath, filename: file.name, ...patch };
      } else if (file.id) {
        payload = { id: file.id, ...patch };
      } else {
        return;
      }
      setSaving(true);
      try {
        await saveFileInfo(server, storage, payload);
        onChanged?.();
      } catch (error) {
        const data = axios.isAxiosError(error) ? error.response?.data : undefined;
        showToast(errorMessageFromResponse(data), 'error');
      } finally {
        setSaving(false);
      }
    },
    [file.id, file.name, folderPath, onChanged, server, showToast, storage],
  );

  return (
    <Card sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'action.hover',
          minHeight: 180,
        }}
      >
        {image && (
          <img
            src={preview}
            alt={file.name ?? file.note ?? ''}
            loading="lazy"
            style={{ maxWidth: '100%', maxHeight: 220, cursor: onImageClick ? 'pointer' : 'default' }}
            onClick={() => onImageClick?.(file)}
          />
        )}
        {video && (
          <video
            controls
            loop
            preload="none"
            poster={preview}
            src={fullFileUrl}
            style={{ maxWidth: '100%', maxHeight: 220 }}
          />
        )}
        {!image && !video && (
          <Typography variant="body2" color="text.secondary">
            {file.name ?? file.type}
          </Typography>
        )}
      </Box>

      <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
        <EditableNote
          value={file.note ?? ''}
          placeholder="Заметки"
          onSave={(note) => save({ note })}
        />

        {file.name && (
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {file.name}
          </Typography>
        )}

        <TagMultiselect
          value={tags}
          options={allTags}
          onChange={(newTags) => save({ tags: newTags })}
          onTagClick={onTagClick}
          placeholder="Теги"
        />

        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={Boolean(file.is_public)}
              disabled={saving}
              onChange={(event) => save({ is_public: event.target.checked })}
            />
          }
          label="public"
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'text.secondary' }}>
          <span>
            {file.type} - {formatSize(file.size)}
          </span>
          <span>{fileDate(file)}</span>
        </Box>
      </CardContent>
    </Card>
  );
}
