import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-card',
        hover && 'hover:shadow-card-hover hover:border-gray-300 transition-all duration-200 cursor-pointer',
        paddingClasses[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  iconBg?: string
  change?: {
    value: number
    label?: string
  }
  className?: string
}

export function StatCard({ title, value, icon, iconBg = 'bg-brand-50', change, className }: StatCardProps) {
  const isPositive = change && change.value >= 0

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={cn('mt-1 text-xs font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
              {isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
              {change.label && <span className="text-gray-400 font-normal ml-1">{change.label}</span>}
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl', iconBg)}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
