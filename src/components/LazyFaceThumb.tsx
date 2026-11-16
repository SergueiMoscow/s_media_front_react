import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import FaceThumb from './FaceThumb';

interface LazyFaceThumbProps {
  serverId: string;
  faceId: number;
  size?: number;
}

/** Миниатюра лица, грузится лениво — только при попадании в область видимости. */
export default function LazyFaceThumb({ serverId, faceId, size = 48 }: LazyFaceThumbProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        <FaceThumb serverId={serverId} faceId={faceId} size={size} />
      ) : (
        <Box sx={{ width: size, height: size, bgcolor: 'action.hover', borderRadius: 1 }} />
      )}
    </div>
  );
}
