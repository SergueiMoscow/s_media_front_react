import { fetchClusterFaces, queryKeys } from '../api';
import type { FaceCluster } from '../types/analyzer';
import FacesDialog from './FacesDialog';

interface ClusterFacesDialogProps {
  serverId: string;
  cluster: FaceCluster;
  onClustersChanged: () => void;
  onClose: () => void;
}

/** Просмотр лиц кластера (обёртка над FacesDialog). */
export default function ClusterFacesDialog({
  serverId,
  cluster,
  onClustersChanged,
  onClose,
}: ClusterFacesDialogProps) {
  return (
    <FacesDialog
      serverId={serverId}
      title={`${cluster.person_name ?? 'Без имени'} — ${cluster.size} лиц`}
      getQueryKey={(params) => queryKeys.clusterFaces(serverId, cluster.id, params)}
      fetchFaces={(params) => fetchClusterFaces(serverId, cluster.id, params)}
      invalidateKeyPrefix={['clusterFaces', serverId, cluster.id]}
      onListChanged={onClustersChanged}
      onClose={onClose}
    />
  );
}
