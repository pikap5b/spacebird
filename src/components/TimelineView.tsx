import { useState } from 'react'
import { format, parse } from 'date-fns'
import { Clock, Users, Calendar, Lock, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime as formatTimeUtil } from '@/lib/timeUtils'

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
  image_url?: string | null
  bookings?: Booking[]
  floor_id?: string
  floor?: {
    id: string
    name: string
  }
  isUnavailable?: boolean // For disabled/blocked desks
}

interface TimelineViewProps {
  desks: Desk[]
  selectedDate: string
  currentUserId?: string
  onSlotClick?: (desk: Desk, startTime: string, endTime: string) => void
  onBookingClick?: (booking: Booking, desk: Desk) => void
}

// Default working hours: 08:00 - 20:00
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 20
const WORKING_HOURS = Array.from({ length: DEFAULT_END_HOUR - DEFAULT_START_HOUR + 1 }, (_, i) => {
  const hour = (DEFAULT_START_HOUR + i).toString().padStart(2, '0')
  return `${hour}:00`
})

// Full 24 hours for calculations
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => {
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
  const [hoveredDeskId, setHoveredDeskId] = useState<string | null>(null)

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours + minutes / 60
  }


  const getBookingPosition = (booking: Booking) => {
    const start = parseTime(booking.start_time)
    const end = booking.end_time ? parseTime(booking.end_time) : 24
    const duration = end - start
    
    // Calculate position within working hours (08:00-20:00)
    const workingHoursStart = DEFAULT_START_HOUR
    const workingHoursEnd = DEFAULT_END_HOUR
    const workingHoursDuration = workingHoursEnd - workingHoursStart + 1
    
    // If booking is outside working hours, don't show or show partially
    if (end < workingHoursStart || start > workingHoursEnd) {
      return { start, end, duration, left: '0%', width: '0%', visible: false }
    }
    
    // Clamp to working hours for display
    const displayStart = Math.max(start, workingHoursStart)
    const displayEnd = Math.min(end, workingHoursEnd + 1)
    const displayDuration = displayEnd - displayStart
    
    const leftPercent = ((displayStart - workingHoursStart) / workingHoursDuration) * 100
    const widthPercent = (displayDuration / workingHoursDuration) * 100
    
    return {
      start,
      end,
      duration,
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      visible: true,
      isAllDay: isAllDayBooking(booking),
    }
  }

  const isSlotAvailable = (desk: Desk, hour: number): boolean => {
    // If desk is unavailable, no slots are available
    if (desk.isUnavailable) return false

    if (!desk.bookings || desk.bookings.length === 0) return true

    const slotStart = hour
    const slotEnd = hour + 1

    // Check against ALL active bookings (regardless of user)
    // If ANY booking overlaps with this slot, it's not available
    return !desk.bookings.some((booking) => {
      // Skip cancelled bookings - they don't block the slot
      if (booking.status === 'cancelled') return false

      const bookingStart = parseTime(booking.start_time)
      // Handle all-day bookings (end_time is null or 23:59)
      const bookingEnd = booking.end_time
        ? parseTime(booking.end_time)
        : 24 // All day extends to end of day

      // Check for any overlap - if ANY part overlaps, slot is not available
      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      )
    })
  }

  const isAllDayBooking = (booking: Booking): boolean => {
    if (!booking.end_time) return true
    const start = parseTime(booking.start_time)
    const end = parseTime(booking.end_time)
    return start === 0 && end >= 23.5
  }

  const handleSlotClick = (desk: Desk, hour: number) => {
    // Prevent clicking on unavailable desks or occupied slots
    if (desk.isUnavailable || !isSlotAvailable(desk, hour)) {
      return
    }

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
      // Dark navy (#0f172b) for user's own bookings
      return 'bg-[#0f172b] hover:bg-[#1e293b] text-white'
    }
    // Muted grey for other users' bookings
    return 'bg-slate-400 hover:bg-slate-500 text-white'
  }

  const formattedDate = format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'EEE, d MMM yyyy')

  // Group desks by floor
  const desksByFloor = desks.reduce((acc, desk) => {
    const floorId = desk.floor_id || 'unknown'
    // Handle both object and array formats from Supabase
    const floor = Array.isArray(desk.floor) ? desk.floor[0] : desk.floor
    const floorName = floor?.name || 'Unknown Floor'
    if (!acc[floorId]) {
      acc[floorId] = { floorId, floorName, desks: [] }
    }
    acc[floorId].desks.push(desk)
    return acc
  }, {} as Record<string, { floorId: string; floorName: string; desks: Desk[] }>)
  
  // Sort floors by name
  const sortedFloorGroups = Object.values(desksByFloor).sort((a, b) => 
    a.floorName.localeCompare(b.floorName)
  )


  return (
    <div className="w-full overflow-x-auto bg-slate-50/50">
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
            <div className="w-64 p-4 font-semibold border-r bg-background">Desk / Space</div>
            <div className="flex-1 flex bg-white overflow-x-auto">
              {WORKING_HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 border-r border-solid p-2 text-center text-sm font-medium min-w-[60px] flex-shrink-0"
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

        {/* Floor groups */}
        <div>
          {sortedFloorGroups.map((floorGroup, floorIndex) => (
            <div key={floorGroup.floorId} className="border-b">
              {/* Floor header */}
              <div className="flex bg-slate-100/50 border-b">
                <div className="w-64 p-3 border-r bg-slate-100/50" style={{ borderRightColor: '#e5e7eb' }}>
                  <div className="font-bold text-base text-gray-800">
                    {floorGroup.floorName}
                  </div>
                </div>
                <div className="flex-1 bg-white" />
              </div>

              {/* Desks in this floor */}
              {floorGroup.desks.map((desk, deskIndex) => (
                <div 
                  key={desk.id} 
                  className={cn(
                    "flex min-h-[100px] bg-white hover:bg-slate-50/50",
                    deskIndex < floorGroup.desks.length - 1 && "border-b border-gray-100"
                  )}
                >
                  {/* Desk info column */}
                  <div 
                    className={cn(
                      "w-64 p-4 border-r flex flex-col justify-center relative",
                      desk.isUnavailable ? "bg-gray-100/50" : "bg-white"
                    )}
                    style={{ borderRightColor: '#e5e7eb' }}
                    onMouseEnter={() => setHoveredDeskId(desk.id)}
                    onMouseLeave={() => setHoveredDeskId(null)}
                  >
                    <div className={cn(
                      "font-medium",
                      desk.isUnavailable ? "text-muted-foreground" : "text-gray-900"
                    )}>
                      {desk.name}
                    </div>
                    {/* Image preview on hover */}
                    {hoveredDeskId === desk.id && (
                      <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-2 pointer-events-none min-w-[256px]">
                        {desk.image_url ? (
                          <img
                            src={desk.image_url}
                            alt={desk.name}
                            className="w-64 h-48 object-cover rounded"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const placeholder = target.nextElementSibling as HTMLElement
                              if (placeholder) placeholder.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        {!desk.image_url && (
                          <div className="w-64 h-48 bg-gray-100 rounded flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon className="h-12 w-12 mb-2" />
                            <span className="text-sm">No image available</span>
                          </div>
                        )}
                        {desk.image_url && (
                          <div className="hidden w-64 h-48 bg-gray-100 rounded flex-col items-center justify-center text-gray-400">
                            <ImageIcon className="h-12 w-12 mb-2" />
                            <span className="text-sm">Image failed to load</span>
                          </div>
                        )}
                        <div className="mt-2 text-xs font-medium text-gray-700 text-center">
                          {desk.name}
                        </div>
                      </div>
                    )}
                    {desk.capacity && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{desk.capacity}</span>
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
                  <div className="flex-1 relative bg-white">
                    {desk.isUnavailable ? (
                      // Unavailable desk - greyed out with lock
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <Lock className="h-5 w-5" />
                          <span className="text-xs">Unavailable</span>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex overflow-x-auto">
                        {WORKING_HOURS.map((hour, index) => {
                          const hourNum = DEFAULT_START_HOUR + index
                          const available = isSlotAvailable(desk, hourNum)
                          const isSelected =
                            selectedSlot?.deskId === desk.id &&
                            selectedSlot?.startTime === hour
                          const isLastSlot = index === WORKING_HOURS.length - 1

                          return (
                            <div
                              key={hour}
                        className={cn(
                          'flex-1 border-r border-solid transition-colors relative flex-shrink-0',
                          'min-w-[60px]',
                          available
                            ? 'bg-white hover:bg-[#f1f5f9] cursor-pointer'
                            : 'bg-slate-100/50 cursor-not-allowed',
                          isSelected && 'bg-[#0f172b]/10 ring-2 ring-[#0f172b]'
                        )}
                              style={{
                                borderRightColor: '#e5e7eb',
                              }}
                              onClick={() => available && handleSlotClick(desk, hourNum)}
                              title={
                                available
                                  ? `Available: ${hour} - ${WORKING_HOURS[index + 1] || `${DEFAULT_END_HOUR + 1}:00`}`
                                  : 'Not available - already booked'
                              }
                            />
                          )
                        })}
                      </div>
                    )}

                {/* Booking cards */}
                {desk.bookings?.map((booking) => {
                  const position = getBookingPosition(booking)
                  const isMyBooking = booking.user_id === currentUserId
                  const isAllDay = isAllDayBooking(booking)

                  // Skip if booking is not visible in working hours
                  if (!position.visible) return null

                  return (
                    <div
                      key={booking.id}
                        className={cn(
                          'absolute top-2 bottom-2 rounded px-3 py-1.5 text-xs cursor-pointer shadow-sm',
                          getBookingColor(booking),
                          isMyBooking && 'ring-2 ring-[#0f172b]/30',
                          isAllDay && 'min-w-[100px]'
                        )}
                      style={{
                        left: position.left,
                        width: position.width,
                        minWidth: isAllDay ? '100px' : '60px',
                      }}
                      onClick={() => onBookingClick?.(booking, desk)}
                      title={
                        isAllDay
                          ? 'All day booked'
                          : `${formatTimeUtil(booking.start_time)} - ${formatTimeUtil(booking.end_time || '24:00')}`
                      }
                    >
                      {isAllDay ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">All day booked</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="font-medium">
                              {formatTimeUtil(booking.start_time)} – {formatTimeUtil(booking.end_time || '24:00')}
                            </span>
                          </div>
                          <div className="text-[10px] opacity-90 mt-0.5 font-medium">
                            {isMyBooking
                              ? 'My booking'
                              : booking.user?.full_name || booking.user?.email || 'Unknown user'}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

