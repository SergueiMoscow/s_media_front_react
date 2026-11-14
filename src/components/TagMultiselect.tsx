import { Autocomplete, TextField } from '@mui/material';

interface TagMultiselectProps {
  value: string[];
  options: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/** Мультиселект тегов: можно выбирать существующие и создавать новые. */
export default function TagMultiselect({
  value,
  options,
  onChange,
  placeholder = 'Теги',
}: TagMultiselectProps) {
  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      options={options}
      value={value}
      onChange={(_event, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField {...params} variant="standard" placeholder={placeholder} />
      )}
      slotProps={{ chip: { size: 'small' } }}
      fullWidth
    />
  );
}
