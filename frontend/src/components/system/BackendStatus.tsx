import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle } from 'lucide-react';
import { getHealth } from '../../api/health';

export default function BackendStatus() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, refetchInterval: 15000, retry: 1 });
  const ok = health.data?.status === 'ok';
  return (
    <span className={ok ? 'status-pill ok' : 'status-pill warn'} title="Backend health">
      {ok ? <Activity size={15} /> : <AlertTriangle size={15} />}
      {ok ? 'API online' : 'API offline'}
    </span>
  );
}