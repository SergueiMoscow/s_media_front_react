import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  createServer,
  createStorage,
  deleteServer,
  deleteStorage,
  fetchServers,
  fetchStorages,
  queryKeys,
  updateServer,
  updateStorage,
} from '../api';
import { errorMessageFromResponse } from '../api/client';
import type { Server, Storage } from '../types/models';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastContext';

interface ServerForm {
  open: boolean;
  id: string | null;
  name: string;
  url: string;
}

interface StorageForm {
  open: boolean;
  id: string | null;
  server_id: string;
  key: string;
  name: string;
  path: string;
}

interface ConfirmState {
  kind: 'server' | 'storage';
  title: string;
  message: string;
  server?: Server;
  storage?: Storage;
}

const emptyServerForm: ServerForm = { open: false, id: null, name: '', url: '' };
const emptyStorageForm: StorageForm = { open: false, id: null, server_id: '', key: '', name: '', path: '' };

export default function StoragesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [serverForm, setServerForm] = useState<ServerForm>(emptyServerForm);
  const [storageForm, setStorageForm] = useState<StorageForm>(emptyStorageForm);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const serversQuery = useQuery({ queryKey: queryKeys.servers, queryFn: fetchServers });
  const storagesQuery = useQuery({
    queryKey: queryKeys.storages(selectedServer?.id),
    queryFn: () => fetchStorages(selectedServer!.id),
    enabled: Boolean(selectedServer),
  });

  const servers = serversQuery.data ?? [];
  const storages = storagesQuery.data ?? [];

  const handleError = (error: unknown, fallback: string) => {
    const data = axios.isAxiosError(error) ? error.response?.data : undefined;
    showToast(errorMessageFromResponse(data) || fallback, 'error');
  };

  const refreshAfterServerChange = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.servers });
    queryClient.invalidateQueries({ queryKey: queryKeys.storages() });
    queryClient.invalidateQueries({ queryKey: queryKeys.storages(selectedServer?.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.serversContent });
    queryClient.invalidateQueries({ queryKey: queryKeys.main });
  };

  const refreshAfterStorageChange = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.storages() });
    queryClient.invalidateQueries({ queryKey: queryKeys.storages(selectedServer?.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.serversContent });
    queryClient.invalidateQueries({ queryKey: queryKeys.main });
  };

  const submitServer = async () => {
    try {
      const data = { name: serverForm.name, url: serverForm.url };
      if (serverForm.id) {
        await updateServer(serverForm.id, data);
      } else {
        await createServer(data);
      }
      setServerForm(emptyServerForm);
      refreshAfterServerChange();
    } catch (error) {
      handleError(error, 'Ошибка сохранения сервера');
    }
  };

  const submitStorage = async () => {
    try {
      const data = {
        server_id: storageForm.server_id,
        key: storageForm.key,
        name: storageForm.name,
        path: storageForm.path,
      };
      if (storageForm.id) {
        await updateStorage(storageForm.id, data);
      } else {
        await createStorage(data);
      }
      setStorageForm(emptyStorageForm);
      refreshAfterStorageChange();
    } catch (error) {
      handleError(error, 'Ошибка сохранения хранилища');
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    const { kind, server, storage } = confirm;
    setConfirm(null);
    try {
      if (kind === 'server' && server) {
        await deleteServer(server.id);
        if (selectedServer?.id === server.id) setSelectedServer(null);
        refreshAfterServerChange();
      } else if (kind === 'storage' && storage && selectedServer) {
        await deleteStorage(selectedServer.id, storage.id);
        refreshAfterStorageChange();
      }
    } catch (error) {
      handleError(error, 'Ошибка удаления');
    }
  };

  const handleDeleteServer = (server: Server) => {
    setConfirm({
      kind: 'server',
      title: 'Удалить сервер',
      message: `Удалить сервер «${server.name}»?`,
      server,
    });
  };

  const handleDeleteStorage = (storage: Storage) => {
    setConfirm({
      kind: 'storage',
      title: 'Удалить хранилище',
      message: `Удалить хранилище «${storage.name}»?`,
      storage,
    });
  };

  const openEditServer = (server: Server) => {
    setServerForm({ open: true, id: server.id, name: server.name, url: server.url });
  };

  const openEditStorage = (storage: Storage) => {
    setStorageForm({
      open: true,
      id: storage.id,
      server_id: storage.server_id,
      key: '',
      name: storage.name,
      path: storage.path,
    });
  };

  const selectServer = (server: Server) => {
    setSelectedServer(server);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {/* Серверы */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Серверы</Typography>
              <IconButton color="primary" onClick={() => setServerForm({ ...emptyServerForm, open: true })} aria-label="Добавить сервер">
                <AddIcon />
              </IconButton>
            </Box>
            {serversQuery.isLoading && <CircularProgress size={20} />}
            <List dense>
              {servers.map((server) => (
                <ListItem
                  key={server.id}
                  secondaryAction={
                    <Box>
                      <IconButton size="small" onClick={() => openEditServer(server)} aria-label="Изменить сервер">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteServer(server)} aria-label="Удалить сервер">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemButton selected={selectedServer?.id === server.id} onClick={() => selectServer(server)}>
                    <ListItemText primary={server.name} secondary={server.url} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Хранилища */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Хранилища</Typography>
              <IconButton
                color="primary"
                disabled={!selectedServer}
                onClick={() =>
                  setStorageForm({
                    ...emptyStorageForm,
                    open: true,
                    server_id: selectedServer?.id ?? '',
                  })
                }
                aria-label="Добавить хранилище"
              >
                <AddIcon />
              </IconButton>
            </Box>
            {!selectedServer ? (
              <Typography variant="body2" color="text.secondary">
                Выберите сервер, чтобы увидеть его хранилища.
              </Typography>
            ) : storagesQuery.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              <List dense>
                {storages.map((storage) => (
                  <ListItem
                    key={storage.id}
                    secondaryAction={
                      <Box>
                        <IconButton size="small" onClick={() => openEditStorage(storage)} aria-label="Изменить хранилище">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteStorage(storage)} aria-label="Удалить хранилище">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={`Имя: ${storage.name}`}
                      secondary={`Путь: ${storage.path}, id: ${storage.server_id}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Форма сервера */}
      <Dialog open={serverForm.open} onClose={() => setServerForm(emptyServerForm)} maxWidth="xs" fullWidth>
        <DialogTitle>{serverForm.id ? `Сервер ${serverForm.name}` : 'Добавить сервер'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Название сервера"
              required
              value={serverForm.name}
              onChange={(event) => setServerForm((f) => ({ ...f, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="URL сервера"
              required
              value={serverForm.url}
              onChange={(event) => setServerForm((f) => ({ ...f, url: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServerForm(emptyServerForm)}>Отмена</Button>
          <Button variant="contained" onClick={submitServer}>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Форма хранилища */}
      <Dialog open={storageForm.open} onClose={() => setStorageForm(emptyStorageForm)} maxWidth="xs" fullWidth>
        <DialogTitle>{storageForm.id ? `Хранилище ${storageForm.name}` : 'Добавить хранилище'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="storage-server-label">Выберите сервер</InputLabel>
              <Select
                labelId="storage-server-label"
                label="Выберите сервер"
                value={storageForm.server_id}
                onChange={(event) => setStorageForm((f) => ({ ...f, server_id: event.target.value }))}
              >
                {servers.map((server) => (
                  <MenuItem key={server.id} value={server.id}>
                    {server.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ключ хранилища"
              value={storageForm.key}
              onChange={(event) => setStorageForm((f) => ({ ...f, key: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Название хранилища"
              value={storageForm.name}
              onChange={(event) => setStorageForm((f) => ({ ...f, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="Путь хранилища"
              value={storageForm.path}
              onChange={(event) => setStorageForm((f) => ({ ...f, path: event.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStorageForm(emptyStorageForm)}>Отмена</Button>
          <Button variant="contained" onClick={submitStorage}>
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </Box>
  );
}
