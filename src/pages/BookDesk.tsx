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
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Circle } from 'lucide-react'

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

  // Fetch desks for selected floor
  const { data: desks, isLoading: desksLoading } = useQuery({
    queryKey: ['desks', selectedFloor, selectedDate],
    queryFn: async () => {
      if (!selectedFloor) return []
      
      // Get all desks for the floor
      const { data: desksData, error: desksError } = await supabase
        .from('desks')
        .select('*')
        .eq('floor_id', selectedFloor)
        .order('name')
      
      if (desksError) throw desksError

      // Get reservations for the selected date
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('booking_date', selectedDate)
        .in('status', ['confirmed', 'checked_in'])

      if (reservationsError) throw reservationsError

      // Map reservations to desks
      const reservedDeskIds = new Set(
        reservations?.map((r: any) => r.desk_id) || []
      )

      return (desksData || []).map((desk: any) => ({
        ...desk,
        isReserved: reservedDeskIds.has(desk.id),
        isMyBooking: reservations?.some(
          (r: any) => r.desk_id === desk.id && r.user_id === profile?.id
        ),
      }))
    },
    enabled: !!selectedFloor && !!selectedDate,
  })

  const selectedFloorData = floors?.find((f) => f.id === selectedFloor)

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDesk || !profile?.id) throw new Error('Missing required data')

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: profile.id,
          desk_id: selectedDesk.id,
          booking_date: selectedDate,
          start_time: fullDay ? '00:00' : startTime,
          end_time: fullDay ? '23:59' : endTime,
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
    },
  })

  const handleDeskClick = (desk: any) => {
    if (desk.isReserved && !desk.isMyBooking) return
    setSelectedDesk(desk)
    setBookingModalOpen(true)
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
            <CardTitle>Available Desks</CardTitle>
            <CardDescription>
              Click on a desk to book it. Green = Available, Red = Occupied, Blue = Your Booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {desksLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading desks...</div>
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

