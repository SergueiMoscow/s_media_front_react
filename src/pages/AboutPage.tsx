import { Box, Link, List, ListItem, Typography } from '@mui/material';
import Mermaid from '../components/Mermaid';
import { useColorMode } from '../ColorModeContext';

const SCHEMA = `flowchart LR
  subgraph hosting["Хостинг"]
    FE["s_media_front_react<br/>(React + TypeScript)"]
    API["s_media_api<br/>(Django + DRF)"]
  end
  subgraph node["Узел (homeserver)"]
    SVC["s_media_service<br/>(FastAPI)"]
    AN["s_media_analyzer<br/>(FastAPI)"]
    DB[("PostgreSQL")]
    DISK[("Диски с фото")]
  end
  FE -->|"JWT"| API
  API -->|"X-USER-ID"| SVC
  API -->|"X-API-Key"| AN
  SVC --> DB
  AN --> DB
  SVC --> DISK
  AN --> DISK`;

export default function AboutPage() {
  const { mode } = useColorMode();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Media Explorer
      </Typography>
      <Typography component="p" sx={{ mb: 1.5 }}>
        Приложение «Media Explorer» — каталогизатор фото и видео: объединяет в одном месте
        файлы, размещённые на разных компьютерах и в разных хранилищах. Состоит из следующих
        компонентов:
      </Typography>

      <List sx={{ listStyleType: 'decimal', pl: 3 }}>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>s_media_front_react:</b> веб-интерфейс (React + TypeScript).{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_front_react" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>s_media_api:</b> прослойка между фронтом и сервисами, проверка прав (Django + DRF).{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_api" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>s_media_service:</b> каталог файлов и хранилища (FastAPI + PostgreSQL).{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_service" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>s_media_analyzer:</b> анализ фото: поиск лиц и геотеги (FastAPI + pgvector).{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_analyzer" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>s_media_deploy:</b> развёртывание (Ansible).{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_deploy" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
      </List>

      <Mermaid chart={SCHEMA} mode={mode} key={mode} />

      <Typography component="p" sx={{ mb: 1.5 }}>
        Основная идея приложения — объединить в одном месте данные (изображения, видео),
        хранящиеся на разных серверах в разных каталогах. Система не создаёт, не изменяет и не
        удаляет файлы: используются только существующие файлы. Анализатор находит лица и
        геотеги на уже имеющихся фото.
      </Typography>

      <Typography component="p" sx={{ mb: 1.5 }}>
        <b>Раздел «Серверы»</b> позволяет добавлять серверы с их хранилищами; в БД записывается
        адрес сервера и путь к папке хранилища. Учётная запись может иметь несколько серверов,
        каждый сервер — несколько папок (хранилищ). На хранилище должен быть установлен и запущен
        сервис (s_media_service). Для предотвращения несанкционированного доступа к сервису
        администратором создаётся ключ доступа, который запрашивается при изменении данных о
        сервере (добавление, изменение и удаление хранилищ).
      </Typography>

      <Typography component="p" sx={{ mb: 1.5 }}>
        <b>Раздел «Хранилища»</b> показывает содержимое хранилищ всех серверов. Его видит только
        пользователь, создавший эти хранилища.
      </Typography>

      <Typography component="p" sx={{ mb: 1.5 }}>
        При любом изменении (добавление описания, тега, изменение доступа) элемент записывается в
        БД сервиса и становится элементом каталога.
      </Typography>

      <Typography component="p" sx={{ mb: 1.5 }}>
        <b>Раздел «Каталог»</b> позволяет просматривать и фильтровать файлы, занесённые в каталог
        выбранного хранилища, и редактировать их метаданные (описание, теги, публичность).
      </Typography>

      <Typography component="p" sx={{ mb: 1.5 }}>
        <b>Раздел «Лица»</b> показывает найденных людей, позволяет давать им имена, игнорировать
        кластеры и искать похожие лица.
      </Typography>

      <Typography component="p" sx={{ mb: 1.5 }}>
        <b>Раздел «Анализатор»</b> показывает статус фоновой обработки (лица и геотеги) по каждому
        серверу.
      </Typography>
    </Box>
  );
}
