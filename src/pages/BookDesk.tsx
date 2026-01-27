import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TimelineView } from '@/components/TimelineView'
import { format, parse } from 'date-fns'
import { Calendar, Grid, List } from 'lucide-react'

export function BookDesk() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedFloor, setSelectedFloor] = useState<string>('')
  const [selectedDesk, setSelectedDesk] = useState<any>(null)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [fullDay, setFullDay] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline')

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name')
      if (error) throw error
      return data || []
    },
  })

  // Fetch floors for selected location
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

  // Fetch desks for selected floor (or all floors) with bookings
  const { data: desks, isLoading: desksLoading } = useQuery({
    queryKey: ['desks', selectedFloor, selectedLocation, selectedDate],
    queryFn: async () => {
      if (!selectedFloor || !selectedLocation) return []
      
      // Get all desks for the floor(s)
      let desksQuery = supabase
        .from('desks')
        .select(`
          *,
          floors (
            id,
            name
          )
        `)

      if (selectedFloor !== 'all') {
        desksQuery = desksQuery.eq('floor_id', selectedFloor)
      } else {
        // If "all floors", get desks from all floors in the location
        const { data: locationFloors } = await supabase
          .from('floors')
          .select('id')
          .eq('location_id', selectedLocation)
        
        if (locationFloors && locationFloors.length > 0) {
          const floorIds = locationFloors.map((f: any) => f.id)
          desksQuery = desksQuery.in('floor_id', floorIds)
        } else {
          return []
        }
      }

      const { data: desksData, error: desksError } = await desksQuery.order('name')
      
      if (desksError) throw desksError

      // Get reservations for the selected date with user info
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          users (
            id,
            email,
            full_name
          )
        `)
        .eq('booking_date', selectedDate)
        .in('status', ['confirmed', 'checked_in'])

      if (reservationsError) throw reservationsError

      // Map reservations to desks with time slot information
      return (desksData || []).map((desk: any) => {
        const deskBookings = (reservations || []).filter(
          (r: any) => r.desk_id === desk.id
        )

        // For grid view compatibility
        const reservedDeskIds = new Set(
          reservations?.map((r: any) => r.desk_id) || []
        )

        return {
          ...desk,
          floor_id: desk.floor_id,
          floor: desk.floors,
          bookings: deskBookings.map((b: any) => ({
            id: b.id,
            start_time: b.start_time,
            end_time: b.end_time,
            user_id: b.user_id,
            status: b.status,
            user: b.users,
          })),
          isReserved: reservedDeskIds.has(desk.id),
          isMyBooking: deskBookings.some(
            (r: any) => r.user_id === profile?.id
          ),
        }
      })
    },
    enabled: !!selectedFloor && !!selectedLocation && !!selectedDate,
  })

  const selectedFloorData = floors?.find((f) => f.id === selectedFloor)

  // Check for time conflicts (including all-day bookings)
  const checkTimeConflict = (deskId: string, start: string, end: string): boolean => {
    const desk = desks?.find((d: any) => d.id === deskId)
    if (!desk || !desk.bookings || desk.bookings.length === 0) return false

    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours + minutes / 60
    }

    const bookingStart = parseTime(start)
    const bookingEnd = parseTime(end)

    return desk.bookings.some((booking: any) => {
      const existingStart = parseTime(booking.start_time)
      // Handle all-day bookings (end_time is null or 23:59)
      const existingEnd = booking.end_time
        ? parseTime(booking.end_time)
        : 24 // All day extends to end of day

      // Check for overlap
      return (
        (bookingStart >= existingStart && bookingStart < existingEnd) ||
        (bookingEnd > existingStart && bookingEnd <= existingEnd) ||
        (bookingStart <= existingStart && bookingEnd >= existingEnd)
      )
    })
  }

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDesk || !profile?.id) throw new Error('Missing required data')

      const finalStartTime = fullDay ? '00:00' : startTime
      const finalEndTime = fullDay ? '23:59' : endTime

      // Check for conflicts
      if (checkTimeConflict(selectedDesk.id, finalStartTime, finalEndTime)) {
        throw new Error(
          'This time slot is already booked. Please select a different time.'
        )
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: profile.id,
          desk_id: selectedDesk.id,
          booking_date: selectedDate,
          start_time: finalStartTime,
          end_time: finalEndTime,
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
      setStartTime('09:00')
      setEndTime('17:00')
      setFullDay(false)
    },
  })

  const handleDeskClick = (desk: any) => {
    if (desk.isReserved && !desk.isMyBooking) return
    setSelectedDesk(desk)
    setBookingModalOpen(true)
  }

  const handleTimelineSlotClick = (desk: any, startTime: string, endTime: string) => {
    setSelectedDesk(desk)
    setStartTime(startTime)
    setEndTime(endTime)
    setFullDay(false)
    setBookingModalOpen(true)
  }

  const handleBookingClick = (booking: any, desk: any) => {
    // Could show booking details or allow editing if it's the user's booking
    if (booking.user_id === profile?.id) {
      // Show edit/cancel options
      console.log('Your booking:', booking)
    }
  }

  const handleConfirmBooking = () => {
    bookingMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Book a Desk</h1>
        <p className="text-muted-foreground mt-1">
          Select a location, date, and floor to view available desks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Options</CardTitle>
          <CardDescription>Choose your workspace preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                id="location"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value)
                  setSelectedFloor('')
                }}
              >
                <option value="">Select a location</option>
                {locations?.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Select
                id="floor"
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                disabled={!selectedLocation}
              >
                <option value="">Select a floor</option>
                <option value="all">All floors</option>
                {floors?.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedFloorData && desks && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Desks</CardTitle>
                <CardDescription>
                  {viewMode === 'timeline' ? (
                    <>
                      {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d, yyyy')} • Click on an available time slot to book. Green = Available, Red = Booked, Blue = Your Booking
                    </>
                  ) : (
                    'Click on a desk to book it. Green = Available, Red = Occupied, Blue = Your Booking'
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  title="Timeline View"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {desksLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading desks...</div>
            ) : viewMode === 'timeline' ? (
              <TimelineView
                desks={desks}
                selectedDate={selectedDate}
                currentUserId={profile?.id}
                onSlotClick={handleTimelineSlotClick}
                onBookingClick={handleBookingClick}
              />
            ) : (
              <div
                className="grid gap-2 p-4 border rounded-lg"
                style={{
                  gridTemplateColumns: `repeat(${selectedFloorData.grid_cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${selectedFloorData.grid_rows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: selectedFloorData.grid_rows * selectedFloorData.grid_cols }).map((_, index) => {
                  const row = Math.floor(index / selectedFloorData.grid_cols) + 1
                  const col = (index % selectedFloorData.grid_cols) + 1
                  const desk = desks.find(
                    (d: any) => d.grid_row === row && d.grid_col === col
                  )

                  if (!desk) {
                    return (
                      <div
                        key={index}
                        className="aspect-square border border-dashed border-muted rounded flex items-center justify-center text-muted-foreground text-xs"
                      >
                        Empty
                      </div>
                    )
                  }

                  const getDeskColor = () => {
                    if (desk.isMyBooking) return 'bg-blue-500 hover:bg-blue-600 text-white'
                    if (desk.isReserved) return 'bg-red-500 hover:bg-red-600 text-white cursor-not-allowed'
                    return 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                  }

                  return (
                    <button
                      key={desk.id}
                      onClick={() => handleDeskClick(desk)}
                      disabled={desk.isReserved && !desk.isMyBooking}
                      className={`aspect-square border rounded flex flex-col items-center justify-center p-2 transition-colors ${getDeskColor()}`}
                      title={desk.name}
                    >
                      <div className="text-xs font-medium text-center">{desk.name}</div>
                      {desk.equipment && desk.equipment.length > 0 && (
                        <div className="text-[10px] mt-1 opacity-90">
                          {desk.equipment.length} items
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Desk: {selectedDesk?.name}</DialogTitle>
            <DialogDescription>
              Confirm your booking details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                <input
                  type="checkbox"
                  checked={fullDay}
                  onChange={(e) => setFullDay(e.target.checked)}
                  className="mr-2"
                />
                Full Day Booking
              </Label>
            </div>
            {!fullDay && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
            {selectedDesk?.equipment && selectedDesk.equipment.length > 0 && (
              <div>
                <Label>Equipment</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedDesk.equipment.map((eq: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {bookingMutation.error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {bookingMutation.error instanceof Error
                  ? bookingMutation.error.message
                  : 'Failed to create booking'}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking} disabled={bookingMutation.isPending}>
              {bookingMutation.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

