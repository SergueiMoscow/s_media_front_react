import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface FolderBreadcrumbsProps {
  server: string;
  storage: string;
  folderPath: string;
}

/** Хлебные крошки «Папка: <корень> / сегмент / сегмент». */
export default function FolderBreadcrumbs({ server, storage, folderPath }: FolderBreadcrumbsProps) {
  const navigate = useNavigate();
  const parts = folderPath ? folderPath.split('/').filter(Boolean) : [];

  const go = (path: string) => {
    navigate(`/folder_content/${server}/${storage}/${path}`);
  };

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ '& .MuiBreadcrumbs-separator': { mx: 0.5 } }}>
      <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
        Папка:
      </Typography>
      <Link component="button" variant="body2" underline="hover" onClick={() => go('')}>
        &lt;корень&gt;
      </Link>
      {parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join('/');
        const isLast = index === parts.length - 1;
        if (isLast) {
          return (
            <Typography key={path} variant="body2" color="text.primary">
              {part}
            </Typography>
          );
        }
        return (
          <Link key={path} component="button" variant="body2" underline="hover" onClick={() => go(path)}>
            {part}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
