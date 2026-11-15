import { Box, Chip, Paper, Typography } from '@mui/material';
import type { AnalyzerKind, AnalyzerKindCounts, AnalyzerStats } from '../types/analyzer';
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
          const counts: Partial<AnalyzerKindCounts> = stats.queue[kind] ?? {};
          const done = counts.done ?? 0;
          const remaining = (counts.pending ?? 0) + (counts.processing ?? 0);
          const failed = counts.failed ?? 0;
          const skipped = counts.skipped ?? 0;
          return (
            <Paper key={kind} variant="outlined" sx={{ p: 1.5, minWidth: 200, flex: 1 }}>
              <Typography variant="subtitle2">{KIND_LABELS[kind]}</Typography>
              <Typography variant="body2">Обработано: {done}</Typography>
              <Typography variant="body2">Осталось: {remaining}</Typography>
              {failed > 0 && (
                <Typography variant="body2" color="error">
                  Ошибок: {failed}
                </Typography>
              )}
              {skipped > 0 && (
                <Typography variant="body2" color="warning.main">
                  Пропущено: {skipped}
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
