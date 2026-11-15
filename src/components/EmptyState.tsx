import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
  message: string;
}

/** Консистентное пустое состояние (центрированный текст). */
export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
