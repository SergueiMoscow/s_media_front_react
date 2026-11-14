import { useState } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface EditableNoteProps {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
}

/** Поле описания с кнопками «сохранить»/«отмена», появляющимися при фокусе. */
export default function EditableNote({ value, placeholder = 'Заметки', onSave }: EditableNoteProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <TextField
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={() => setEditing(true)}
        placeholder={placeholder}
        variant="standard"
        fullWidth
        size="small"
        slotProps={{ htmlInput: { 'aria-label': placeholder } }}
      />
      {editing && (
        <>
          <IconButton size="small" color="success" onClick={save} aria-label="Сохранить">
            <CheckCircleIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={cancel} aria-label="Отмена">
            <CancelIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  );
}
