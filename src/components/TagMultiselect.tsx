import { Autocomplete, Chip, TextField } from '@mui/material';

interface TagMultiselectProps {
  value: string[];
  options: string[];
  onChange: (tags: string[]) => void;
  onTagClick?: (tag: string) => void;
  placeholder?: string;
}

/** Мультиселект тегов: можно выбирать существующие и создавать новые. */
export default function TagMultiselect({
  value,
  options,
  onChange,
  onTagClick,
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
      renderValue={(tagValue, getItemProps) =>
        tagValue.map((option, index) => {
          const { key, onDelete } = getItemProps({ index });
          return (
            <Chip
              key={key}
              label={option}
              size="small"
              onDelete={onDelete}
              onClick={
                onTagClick
                  ? (event) => {
                      event.stopPropagation();
                      onTagClick(option);
                    }
                  : undefined
              }
              sx={{ cursor: onTagClick ? 'pointer' : 'default' }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField {...params} variant="standard" placeholder={placeholder} />
      )}
      fullWidth
    />
  );
}
