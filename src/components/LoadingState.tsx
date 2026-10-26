import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

/** The startup splash is the only branded loading state. */
export const STARTUP_LOADING_MS = 3000;
export function LoadingState({ compact = false }: { compact?: boolean }) {
  return <div className={cn('loading-state', compact && 'loading-state-compact')}
    role="status" aria-live="polite" aria-busy="true">
    <span className="loading-wordmark">Sonarora</span>
    {!compact && <span className="loading-tagline">Protect bills first</span>}
    <Progress aria-label="Loading Sonarora" className="loading-progress" />
    <span className="loading-copy">Loading…</span>
  </div>;
}
