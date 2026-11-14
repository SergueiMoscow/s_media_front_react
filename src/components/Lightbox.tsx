import { useEffect } from 'react';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { fileUrl } from '../utils/media';
import type { FileObject } from '../types/models';

interface LightboxProps {
  open: boolean;
  files: FileObject[];
  index: number;
  server: string;
  storage: string;
  folderPath?: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function Lightbox({
  open,
  files,
  index,
  server,
  storage,
  folderPath = '',
  onClose,
  onIndexChange,
}: LightboxProps) {
  const current = files[index];

  const prev = () => {
    if (files.length > 1) {
      onIndexChange((index - 1 + files.length) % files.length);
    }
  };

  const next = () => {
    if (files.length > 1) {
      onIndexChange((index + 1) % files.length);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') prev();
      else if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      slotProps={{ paper: { sx: { bgcolor: 'rgba(0,0,0,0.92)', m: 0 } } }}
    >
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 1 }}
          aria-label="Закрыть"
        >
          <CloseIcon />
        </IconButton>

        {files.length > 1 && (
          <IconButton
            onClick={prev}
            sx={{ position: 'absolute', left: 8, color: '#fff', zIndex: 1 }}
            aria-label="Предыдущее"
          >
            <ChevronLeftIcon fontSize="large" />
          </IconButton>
        )}

        {current && (
          <Box sx={{ textAlign: 'center', maxWidth: '100%', px: 6 }}>
            <img
              src={fileUrl(server, storage, current, folderPath)}
              alt={current.name ?? current.note ?? ''}
              style={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain' }}
            />
            <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>
              {current.name || current.note || ''}
            </Typography>
          </Box>
        )}

        {files.length > 1 && (
          <IconButton
            onClick={next}
            sx={{ position: 'absolute', right: 8, color: '#fff', zIndex: 1 }}
            aria-label="Следующее"
          >
            <ChevronRightIcon fontSize="large" />
          </IconButton>
        )}
      </Box>
    </Dialog>
  );
}
