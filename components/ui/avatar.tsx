import Image from 'next/image'
import { cn, getInitials, generateAvatarUrl } from '@/lib/utils'

export interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  showOnline?: boolean
}

const sizeStyles = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
}

const onlineDotSize = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
}

export function Avatar({ src, name, size = 'md', className, showOnline }: AvatarProps) {
  const avatarSrc = src || generateAvatarUrl(name)
  const initials = getInitials(name)

  return (
    <div className={cn('relative flex-shrink-0', sizeStyles[size], className)}>
      <div className={cn(
        'rounded-full overflow-hidden border-2 border-dark-border bg-dark-card',
        'flex items-center justify-center',
        sizeStyles[size]
      )}>
        {avatarSrc.startsWith('https://api.dicebear.com') ? (
          <Image
            src={avatarSrc}
            alt={name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span className="font-semibold text-gray-200">{initials}</span>
        )}
      </div>
      {showOnline && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full bg-emerald-400 border-2 border-dark-bg',
          onlineDotSize[size]
        )} />
      )}
    </div>
  )
}

export function AvatarGroup({
  users,
  max = 4,
  size = 'sm',
}: {
  users: Array<{ name: string; src?: string | null }>
  max?: number
  size?: AvatarProps['size']
}) {
  const visible = users.slice(0, max)
  const overflow = users.length - max

  const sizeMap = { xs: 6, sm: 8, md: 10, lg: 12, xl: 16, '2xl': 24 }
  const overlapW = sizeMap[size]

  return (
    <div className="flex items-center" style={{ marginLeft: `${overlapW / 4}px` }}>
      {visible.map((user, i) => (
        <div key={i} style={{ marginLeft: `-${overlapW / 4}px` }} className="relative">
          <Avatar
            src={user.src}
            name={user.name}
            size={size}
            className="border-2 border-dark-bg"
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'relative rounded-full bg-dark-card border-2 border-dark-border',
            'flex items-center justify-center text-gray-400 font-medium',
            sizeStyles[size]
          )}
          style={{ marginLeft: `-${overlapW / 4}px` }}
        >
          <span className="text-xs">+{overflow}</span>
        </div>
      )}
    </div>
  )
}
