import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { ColorMode } from '../theme';

interface MermaidProps {
  chart: string;
  mode: ColorMode;
}

/** Рендерит Mermaid-диаграмму (mermaid грузится лениво). */
export default function Mermaid({ chart, mode }: MermaidProps) {
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import('mermaid')
      .then(async (mod) => {
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: mode === 'dark' ? 'dark' : 'neutral',
          securityLevel: 'loose',
        });
        const id = `mermaid-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        if (!cancelled) setSvg(rendered);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [chart, mode]);

  if (failed) {
    return <Typography color="text.secondary">Не удалось отобразить схему.</Typography>;
  }

  return (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      {svg ? (
        <Box
          dangerouslySetInnerHTML={{ __html: svg }}
          sx={{ '& svg': { maxWidth: '100%', height: 'auto' } }}
        />
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}
    </Box>
  );
}
