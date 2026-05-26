import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  name: string
  size?: AvatarSize
  className?: string
  online?: boolean
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

const bgColors = [
  'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-cyan-100 text-cyan-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
]

function getColorFromName(name: string): string {
  const index = name.charCodeAt(0) % bgColors.length
  return bgColors[index]
}

export default function Avatar({ src, name, size = 'md', className, online }: AvatarProps) {
  const initials = getInitials(name)
  const colorClass = getColorFromName(name)

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <div className={cn('rounded-full overflow-hidden', sizeClasses[size])}>
          <Image
            src={src}
            alt={name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold select-none',
            sizeClasses[size],
            colorClass
          )}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'xs' ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5',
            online ? 'bg-green-400' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  )
}
