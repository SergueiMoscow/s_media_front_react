import { Box, Chip, Paper, Typography } from '@mui/material';
import type { AnalyzerKind, AnalyzerStats } from '../types/analyzer';
import { KIND_LABELS } from '../utils/analyzer';

const KINDS: AnalyzerKind[] = ['faces', 'geo'];

interface AnalyzerSummaryProps {
  stats: AnalyzerStats;
}

/** Сводка по воркеру анализатора: обработано/осталось по видам + «сейчас обрабатывается». */
export default function AnalyzerSummary({ stats }: AnalyzerSummaryProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {KINDS.map((kind) => {
          const counts = stats.queue[kind] ?? {
            pending: 0,
            processing: 0,
            done: 0,
            failed: 0,
            skipped: 0,
          };
          const remaining = counts.pending + counts.processing;
          return (
            <Paper key={kind} variant="outlined" sx={{ p: 1.5, minWidth: 200, flex: 1 }}>
              <Typography variant="subtitle2">{KIND_LABELS[kind]}</Typography>
              <Typography variant="body2">Обработано: {counts.done}</Typography>
              <Typography variant="body2">Осталось: {remaining}</Typography>
              {counts.failed > 0 && (
                <Typography variant="body2" color="error">
                  Ошибок: {counts.failed}
                </Typography>
              )}
              {counts.skipped > 0 && (
                <Typography variant="body2" color="warning.main">
                  Пропущено: {counts.skipped}
                </Typography>
              )}
            </Paper>
          );
        })}
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="subtitle2">Сейчас обрабатывается:</Typography>
        {stats.processing.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {stats.processing.map((item) => (
              <Chip
                key={item.scanned_file_id}
                size="small"
                color="info"
                label={`${item.folder_path ? `${item.folder_path}/` : ''}${item.filename} (${KIND_LABELS[item.kind]})`}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
