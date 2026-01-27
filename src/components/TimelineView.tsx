import { useState } from 'react'
import { format, parse } from 'date-fns'
import { Clock, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Booking {
  id: string
  start_time: string
  end_time: string | null
  user_id: string
  status: string
  user?: {
    full_name?: string | null
    email?: string
  }
}

interface Desk {
  id: string
  name: string
  capacity?: number
  equipment?: string[] | null
  bookings?: Booking[]
}

interface TimelineViewProps {
  desks: Desk[]
  selectedDate: string
  currentUserId?: string
  onSlotClick?: (desk: Desk, startTime: string, endTime: string) => void
  onBookingClick?: (booking: Booking, desk: Desk) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

export function TimelineView({
  desks,
  selectedDate,
  currentUserId,
  onSlotClick,
  onBookingClick,
}: TimelineViewProps) {
  const [selectedSlot, setSelectedSlot] = useState<{
    deskId: string
    startTime: string
    endTime: string
  } | null>(null)

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours + minutes / 60
  }

  const getBookingPosition = (booking: Booking) => {
    const start = parseTime(booking.start_time)
    const end = booking.end_time ? parseTime(booking.end_time) : start + 1
    const duration = end - start
    return {
      start,
      end,
      duration,
      left: `${(start / 24) * 100}%`,
      width: `${(duration / 24) * 100}%`,
    }
  }

  const isSlotAvailable = (desk: Desk, hour: number): boolean => {
    if (!desk.bookings || desk.bookings.length === 0) return true

    const slotStart = hour
    const slotEnd = hour + 1

    return !desk.bookings.some((booking) => {
      const bookingStart = parseTime(booking.start_time)
      const bookingEnd = booking.end_time
        ? parseTime(booking.end_time)
        : bookingStart + 1

      // Check for overlap
      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      )
    })
  }

  const handleSlotClick = (desk: Desk, hour: number) => {
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`
    
    if (onSlotClick) {
      onSlotClick(desk, startTime, endTime)
    } else {
      setSelectedSlot({ deskId: desk.id, startTime, endTime })
    }
  }

  const getBookingColor = (booking: Booking) => {
    if (booking.user_id === currentUserId) {
      return 'bg-blue-500 hover:bg-blue-600'
    }
    return 'bg-red-500 hover:bg-red-600'
  }

  const formattedDate = format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'EEE, d MMM yyyy')

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Date header */}
        <div className="sticky top-0 z-20 bg-background border-b p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{formattedDate}</span>
          </div>
        </div>
        
        {/* Header with time slots */}
        <div className="sticky top-[73px] z-10 bg-background border-b">
          <div className="flex">
            <div className="w-48 p-4 font-semibold border-r">Desk / Space</div>
            <div className="flex-1 flex">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 border-r border-solid p-2 text-center text-sm font-medium min-w-[60px]"
                  style={{
                    borderColor: '#e5e7eb',
                  }}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desk rows */}
        <div className="divide-y">
          {desks.map((desk) => (
            <div key={desk.id} className="flex min-h-[100px] hover:bg-accent/50">
              {/* Desk info column */}
              <div className="w-48 p-4 border-r flex flex-col justify-center">
                <div className="font-medium">{desk.name}</div>
                {desk.capacity && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    {desk.capacity} {desk.capacity === 1 ? 'person' : 'people'}
                  </div>
                )}
                {desk.equipment && desk.equipment.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {desk.equipment.slice(0, 2).join(', ')}
                    {desk.equipment.length > 2 && ` +${desk.equipment.length - 2}`}
                  </div>
                )}
              </div>

              {/* Timeline column */}
              <div className="flex-1 relative">
                <div className="absolute inset-0 flex">
                  {HOURS.map((hour, index) => {
                    const hourNum = index
                    const available = isSlotAvailable(desk, hourNum)
                    const isSelected =
                      selectedSlot?.deskId === desk.id &&
                      selectedSlot?.startTime === hour

                    return (
                      <div
                        key={hour}
                        className={cn(
                          'flex-1 border-r border-solid cursor-pointer transition-colors relative',
                          'min-w-[60px]',
                          available
                            ? 'bg-green-50 hover:bg-green-100'
                            : 'bg-red-50',
                          isSelected && 'bg-blue-200'
                        )}
                        style={{
                          borderColor: '#e5e7eb',
                        }}
                        onClick={() => available && handleSlotClick(desk, hourNum)}
                        title={
                          available
                            ? `Available: ${hour} - ${HOURS[index + 1] || '24:00'}`
                            : 'Not available'
                        }
                      />
                    )
                  })}
                </div>

                {/* Booking cards */}
                {desk.bookings?.map((booking) => {
                  const position = getBookingPosition(booking)
                  const isMyBooking = booking.user_id === currentUserId

                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        'absolute top-2 bottom-2 rounded px-3 py-2 text-white text-xs cursor-pointer shadow-md',
                        getBookingColor(booking),
                        isMyBooking && 'ring-2 ring-blue-300'
                      )}
                      style={{
                        left: position.left,
                        width: position.width,
                        minWidth: '60px',
                      }}
                      onClick={() => onBookingClick?.(booking, desk)}
                      title={`${booking.start_time} - ${booking.end_time || 'End of day'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium">
                          {booking.start_time}
                          {booking.end_time && ` - ${booking.end_time}`}
                        </span>
                      </div>
                      {booking.user && (
                        <div className="text-[10px] opacity-90 mt-1">
                          {booking.user.full_name || booking.user.email}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

