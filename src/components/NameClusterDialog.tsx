import { useState } from 'react';
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchPeople, queryKeys } from '../api';
import type { PersonSummary } from '../types/analyzer';

export interface AssignBody {
  person_id: string;
  name: string;
  promote: boolean;
}

interface NameClusterDialogProps {
  serverId: string;
  loading?: boolean;
  onSubmit: (body: AssignBody) => void;
  onClose: () => void;
}

/** Диалог именования кластера: новое имя или выбор существующего человека. */
export default function NameClusterDialog({
  serverId,
  loading = false,
  onSubmit,
  onClose,
}: NameClusterDialogProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [newName, setNewName] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<PersonSummary | null>(null);

  const peopleQuery = useQuery({
    queryKey: queryKeys.people(serverId, { limit: 100 }),
    queryFn: () => fetchPeople(serverId, { limit: 100 }),
  });

  const submit = () => {
    if (mode === 'new') {
      const name = newName.trim();
      if (!name) return;
      onSubmit({ person_id: crypto.randomUUID(), name, promote: false });
    } else if (selectedPerson) {
      onSubmit({
        person_id: selectedPerson.person_id,
        name: selectedPerson.names[0] ?? '',
        promote: false,
      });
    }
  };

  const canSubmit =
    mode === 'new' ? Boolean(newName.trim()) : Boolean(selectedPerson);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Назвать кластер</DialogTitle>
      <DialogContent>
        <RadioGroup
          row
          value={mode}
          onChange={(event) => setMode(event.target.value as 'new' | 'existing')}
        >
          <FormControlLabel value="new" control={<Radio />} label="Новое имя" />
          <FormControlLabel
            value="existing"
            control={<Radio />}
            label="Существующий человек"
          />
        </RadioGroup>

        {mode === 'new' ? (
          <TextField
            autoFocus
            label="Имя"
            fullWidth
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            sx={{ mt: 1 }}
          />
        ) : (
          <Autocomplete
            fullWidth
            options={peopleQuery.data?.items ?? []}
            loading={peopleQuery.isLoading}
            value={selectedPerson}
            onChange={(_event, value) => setSelectedPerson(value)}
            getOptionLabel={(person) => person.names.join(', ')}
            renderInput={(params) => (
              <TextField {...params} label="Человек" placeholder="Поиск по имени" sx={{ mt: 1 }} />
            )}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Отмена
        </Button>
        <Button onClick={submit} variant="contained" disabled={!canSubmit || loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'OK'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
