import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import type { RequestParams } from '../types/models';
import TagMultiselect from './TagMultiselect';

interface FilterPanelProps {
  filter: RequestParams;
  allTags: string[];
  onChange: (filter: RequestParams) => void;
}

const SORT_FIELDS = [
  { value: 'created_at', title: 'Дата' },
  { value: 'note', title: 'Описание' },
];

const SORT_DIRECTIONS = [
  { value: 'asc', title: 'По возрастанию' },
  { value: 'desc', title: 'По убыванию' },
];

export default function FilterPanel({ filter, allTags, onChange }: FilterPanelProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchInput, setSearchInput] = useState(filter.search);

  const publicationValue = filter.public === null ? 'all' : filter.public ? 'public' : 'private';

  const applySearch = () => {
    setAnchorEl(null);
    onChange({ ...filter, search: searchInput, page: 1 });
  };

  const setPublic = (value: string) => {
    const next = value === 'all' ? null : value === 'public' ? true : false;
    onChange({ ...filter, public: next, page: 1 });
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', px: 2, py: 1 }}>
      <TextField
        size="small"
        label="Search"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') applySearch();
        }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={applySearch} aria-label="Поиск">
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 240 }}
      />

      <Box sx={{ minWidth: 280, flex: 1 }}>
        <TagMultiselect
          value={filter.tags}
          options={allTags}
          placeholder="Поиск по тегам"
          onChange={(tags) => onChange({ ...filter, tags, page: 1 })}
        />
      </Box>

      <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} aria-label="Фильтр">
        <TuneIcon />
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: 320, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle1">Фильтр</Typography>

          <FormControl fullWidth size="small">
            <InputLabel id="public-filter-label">Фильтр по публикации</InputLabel>
            <Select
              labelId="public-filter-label"
              value={publicationValue}
              label="Фильтр по публикации"
              onChange={(event) => setPublic(event.target.value)}
            >
              <MenuItem value="all">Все</MenuItem>
              <MenuItem value="public">Опубликованные</MenuItem>
              <MenuItem value="private">Неопубликованные</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={filter.date_filter}
                onChange={(event) => onChange({ ...filter, date_filter: event.target.checked, page: 1 })}
              />
            }
            label="Фильтр по дате"
          />

          {filter.date_filter && (
            <>
              <TextField
                label="Дата от"
                type="date"
                size="small"
                fullWidth
                value={filter.date_from}
                onChange={(event) => onChange({ ...filter, date_from: event.target.value, page: 1 })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Дата до"
                type="date"
                size="small"
                fullWidth
                value={filter.date_to}
                onChange={(event) => onChange({ ...filter, date_to: event.target.value, page: 1 })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}

          <Divider />

          <Typography variant="subtitle1">Сортировка</Typography>

          <FormControl fullWidth size="small">
            <InputLabel id="sort-field-label">Поле</InputLabel>
            <Select
              labelId="sort-field-label"
              value={filter.sort || 'created_at'}
              label="Поле"
              onChange={(event) => onChange({ ...filter, sort: event.target.value, page: 1 })}
            >
              {SORT_FIELDS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="sort-direction-label">Направление</InputLabel>
            <Select
              labelId="sort-direction-label"
              value={filter.sort_direction || 'desc'}
              label="Направление"
              onChange={(event) => onChange({ ...filter, sort_direction: event.target.value, page: 1 })}
            >
              {SORT_DIRECTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setAnchorEl(null)} color="inherit">
              Отмена
            </Button>
            <Button onClick={applySearch} variant="contained">
              Поиск
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
