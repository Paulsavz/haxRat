import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

export default function LoadingSpinner({ size = 'md', className, label }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', sizeMap[size])} />
      {label && <p className="text-sm text-ink-500">{label}</p>}
    </div>
  )
}
