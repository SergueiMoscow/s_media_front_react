import { fetchPersonFaces, queryKeys } from '../api';
import type { PersonSummary } from '../types/analyzer';
import FacesDialog from './FacesDialog';

interface PersonFacesDialogProps {
  serverId: string;
  person: PersonSummary;
  onListChanged: () => void;
  onClose: () => void;
}

/** Просмотр лиц человека (обёртка над FacesDialog). */
export default function PersonFacesDialog({
  serverId,
  person,
  onListChanged,
  onClose,
}: PersonFacesDialogProps) {
  return (
    <FacesDialog
      serverId={serverId}
      title={`${person.names[0] ?? 'Без имени'} — ${person.face_count} лиц`}
      getQueryKey={(params) => queryKeys.personFaces(serverId, person.person_id, params)}
      fetchFaces={(params) => fetchPersonFaces(serverId, person.person_id, params)}
      invalidateKeyPrefix={['personFaces', serverId, person.person_id]}
      onListChanged={onListChanged}
      onClose={onClose}
    />
  );
}
