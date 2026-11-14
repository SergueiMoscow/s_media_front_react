import { Box, Pagination } from '@mui/material';

interface PaginationBarProps {
  page: number;
  totalItems: number;
  perPage: number;
  onChange: (page: number) => void;
}

export default function PaginationBar({ page, totalItems, perPage, onChange }: PaginationBarProps) {
  const pagesCount = Math.max(1, Math.ceil(totalItems / perPage));

  if (pagesCount <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      <Pagination
        count={pagesCount}
        page={page}
        color="primary"
        onChange={(_event, value) => onChange(value)}
      />
    </Box>
  );
}
