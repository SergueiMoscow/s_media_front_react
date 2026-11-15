import { Box, Link, List, ListItem, Typography } from '@mui/material';

export default function AboutPage() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Media Explorer
      </Typography>
      <Typography component="p" sx={{ mb: 1.5 }}>
        Приложение «Media Explorer» занимается визуализацией и поддержкой данных, размещённых в
        различных хранилищах. Состоит из трёх приложений:
      </Typography>

      <List sx={{ listStyleType: 'decimal', pl: 3 }}>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>s_media_front:</b> frontend для пользователей (React + TypeScript). Отправляет
          API-запросы на backend и отображает полученные ответы.{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_front" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>s_media_api:</b> backend, работает на Python и Django DRF. Обрабатывает API-запросы
          от frontend, определяет, к какому серверу направить запрос, и перенаправляет его туда.{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_api" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>Media Cataloger:</b> принимает и обрабатывает запросы от backend. Обеспечивает доступ
          к папкам и файлам, а также предоставляет информацию о файлах.{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_service" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
        <ListItem sx={{ display: 'list-item', pl: 0 }}>
          <b>Помощник деплоя:</b> Ansible playbooks для установки компонентов системы.{' '}
          <Link href="https://github.com/SergueiMoscow/s_media_deploy" target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </Link>
        </ListItem>
      </List>

      <Box component="img" src="s_media_schema.png" alt="Схема системы" sx={{ maxWidth: '100%', mb: 2 }} />

      <Typography component="p" sx={{ mb: 1.5 }}>
        Основная идея приложения — объединить в одном месте данные (изображения, видео),
        хранящиеся на разных серверах в разных каталогах. Система не создаёт, не изменяет и не
        удаляет файлы. Используются только существующие файлы, созданные другими приложениями: это
        могут быть как фотоархивы, так и файлы, записанные с камер видеонаблюдения.
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
    </Box>
  );
}
