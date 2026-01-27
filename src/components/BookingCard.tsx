import { format } from 'date-fns'

interface BookingCardProps {
  title: string
  startTime: string
  endTime: string
  userName?: string
  userAvatar?: string
  onEdit?: () => void
}

export function BookingCard({ title, startTime, endTime, userName, userAvatar, onEdit }: BookingCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className="bg-purple-100 border border-purple-200 rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:bg-purple-200 transition-colors"
      onClick={onEdit}
    >
      {userAvatar ? (
        <img src={userAvatar} alt={userName} className="w-6 h-6 rounded-full" />
      ) : (
        <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-medium">
          {getInitials(userName)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">{title}</div>
        <div className="text-xs text-gray-600">{startTime} - {endTime}</div>
      </div>
    </div>
  )
}

