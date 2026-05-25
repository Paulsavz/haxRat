import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100', className)}>{children}</div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  color = 'brand',
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color?: 'brand' | 'green' | 'amber' | 'rose' | 'blue';
}) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-500',
    green: 'bg-green-50 text-green-500',
    amber: 'bg-amber-50 text-amber-500',
    rose: 'bg-rose-50 text-rose-500',
    blue: 'bg-blue-50 text-blue-500',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={cn('p-3 rounded-xl', colorMap[color])}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {change && (
          <p
            className={cn(
              'text-xs mt-1',
              change.startsWith('+') ? 'text-green-600' : 'text-red-500'
            )}
          >
            {change} vs yesterday
          </p>
        )}
      </div>
    </div>
  );
}
