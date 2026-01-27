import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { BookingCard } from './BookingCard'
import { Users, Video } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TimelineViewProps {
  selectedDate: Date
  selectedLocation: string
  selectedFloor: string | null
  spaceType: string
  onBookingClick?: (desk: any, startTime: string, endTime: string) => void
}

export function TimelineView({ selectedDate, selectedLocation, selectedFloor, spaceType, onBookingClick }: TimelineViewProps) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [selectedDesk, setSelectedDesk] = useState<any>(null)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [selectedStartTime, setSelectedStartTime] = useState('')
  const [selectedEndTime, setSelectedEndTime] = useState('')
  const [bookingTitle, setBookingTitle] = useState('')

  // Generate time slots from 8:00 to 23:00
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = 8 + i
    return `${hour.toString().padStart(2, '0')}:00`
  })

  // Fetch floors and desks
  const { data: floors } = useQuery({
    queryKey: ['floors', selectedLocation],
    queryFn: async () => {
      if (!selectedLocation) return []
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('location_id', selectedLocation)
        .order('name')
      if (error) throw error
      return data || []
    },
    enabled: !!selectedLocation,
  })

  const { data: desks } = useQuery({
    queryKey: ['desks', selectedFloor, selectedDate, spaceType],
    queryFn: async () => {
      if (!selectedFloor) return []
      
      const { data: desksData, error: desksError } = await supabase
        .from('desks')
        .select('*')
        .eq('floor_id', selectedFloor)
        .order('name')
      
      if (desksError) throw desksError

      // Get reservations for the selected date
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          users (
            email,
            full_name
          )
        `)
        .eq('booking_date', dateStr)
        .in('status', ['confirmed', 'checked_in'])

      if (reservationsError) throw reservationsError

      // Map reservations to desks
      return (desksData || []).map((desk: any) => ({
        ...desk,
        reservations: reservations?.filter((r: any) => r.desk_id === desk.id) || [],
      }))
    },
    enabled: !!selectedFloor && !!selectedDate,
  })

  const filteredFloors = selectedFloor 
    ? floors?.filter(f => f.id === selectedFloor) || []
    : floors || []

  const handleDeskClick = (desk: any, timeSlot: string) => {
    // Check if this time slot is available
    const hour = parseInt(timeSlot.split(':')[0])
    const slotStart = `${timeSlot}`
    const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`
    
    // Check if there's a booking at this time
    const hasBooking = desk.reservations?.some((r: any) => {
      const bookingStart = r.start_time
      const bookingEnd = r.end_time || `${(parseInt(bookingStart.split(':')[0]) + 1).toString().padStart(2, '0')}:00`
      return slotStart >= bookingStart && slotStart < bookingEnd
    })

    if (!hasBooking) {
      setSelectedDesk(desk)
      setSelectedStartTime(slotStart)
      setSelectedEndTime(slotEnd)
      setBookingModalOpen(true)
    }
  }

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDesk || !bookingTitle || !profile?.id) {
        throw new Error('Missing required data')
      }
      
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: profile.id,
          desk_id: selectedDesk.id,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedStartTime,
          end_time: selectedEndTime,
          status: 'confirmed',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desks'] })
      queryClient.invalidateQueries({ queryKey: ['upcoming-bookings'] })
      setBookingModalOpen(false)
      setSelectedDesk(null)
      setBookingTitle('')
    },
  })

  const handleConfirmBooking = () => {
    bookingMutation.mutate()
  }

  const getBookingAtTime = (desk: any, timeSlot: string) => {
    if (!desk.reservations || desk.reservations.length === 0) return null
    
    const hour = parseInt(timeSlot.split(':')[0])
    const slotStart = `${timeSlot}`
    
    return desk.reservations.find((r: any) => {
      const bookingStart = r.start_time
      const bookingEnd = r.end_time || `${(parseInt(bookingStart.split(':')[0]) + 1).toString().padStart(2, '0')}:00`
      return slotStart >= bookingStart && slotStart < bookingEnd
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Timeline Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          <div className="w-48 border-r border-gray-200 p-2 text-xs font-medium text-gray-600">
            Space
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex min-w-max">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="w-24 border-r border-gray-200 p-2 text-xs font-medium text-gray-600 text-center"
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Body */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {filteredFloors.map((floor) => {
          const floorDesks = desks?.filter((d: any) => d.floor_id === floor.id) || []
          
          return (
            <div key={floor.id} className="border-b border-gray-200">
              {/* Floor Header */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200">
                <span className="font-medium text-gray-900">Floor {floor.name}</span>
              </div>

              {/* Desks/Rooms */}
              {floorDesks.map((desk: any) => (
                <div key={desk.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                  {/* Desk Info */}
                  <div className="w-48 border-r border-gray-200 p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{desk.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{desk.capacity}</span>
                        </div>
                        <Video className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="flex-1 relative overflow-x-auto">
                    <div className="flex min-w-max h-16">
                      {timeSlots.map((time) => {
                        const booking = getBookingAtTime(desk, time)
                        const hasBooking = !!booking

                        return (
                          <div
                            key={time}
                            className={`w-24 border-r border-gray-100 p-1 ${
                              hasBooking ? '' : 'hover:bg-purple-50 cursor-pointer'
                            }`}
                            onClick={() => !hasBooking && handleDeskClick(desk, time)}
                          >
                            {booking && (
                              <BookingCard
                                title="Meeting"
                                startTime={booking.start_time}
                                endTime={booking.end_time || `${(parseInt(booking.start_time.split(':')[0]) + 1).toString().padStart(2, '0')}:00`}
                                userName={booking.users?.full_name || booking.users?.email}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Booking Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book {selectedDesk?.name}</DialogTitle>
            <DialogDescription>
              Create a new booking for {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Booking Title</Label>
              <Input
                id="title"
                value={bookingTitle}
                onChange={(e) => setBookingTitle(e.target.value)}
                placeholder="e.g., Team Meeting"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="p-2 border rounded-md">{selectedStartTime}</div>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <div className="p-2 border rounded-md">{selectedEndTime}</div>
              </div>
            </div>
            {selectedDesk?.equipment && selectedDesk.equipment.length > 0 && (
              <div>
                <Label>Equipment</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDesk.equipment.map((eq: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} disabled={!bookingTitle || bookingMutation.isPending}>
              {bookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

