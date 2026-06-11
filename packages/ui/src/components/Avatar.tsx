import { useState } from 'react';
import { cn } from '../lib/cn';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const statusColor = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-300',
  busy: 'bg-rose-500',
};

function initials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, name, size = 'md', status, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImg = src && !errored;
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full overflow-hidden font-semibold',
          'bg-brand-100 text-brand-700 ring-2 ring-surface',
          sizeMap[size]
        )}
      >
        {showImg ? (
          <img
            src={src!}
            alt={name ?? ''}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          initials(name)
        )}
      </span>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface',
            statusColor[status]
          )}
        />
      )}
    </span>
  );
}
