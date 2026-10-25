import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

/** One loading language for startup, comparison and staged checks. Never delays work. */
export function LoadingState({ compact = false }: { compact?: boolean }) {
  return <div className={cn('loading-state', compact && 'loading-state-compact')}
    role="status" aria-live="polite" aria-busy="true">
    <span className="loading-wordmark">Sonarora</span>
    {!compact && <span className="loading-tagline">Protect bills first</span>}
    <Progress aria-label="Loading Sonarora" className="loading-progress" />
    <span className="loading-copy">Loading…</span>
  </div>;
}
