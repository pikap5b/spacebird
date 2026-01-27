import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, isPast, parseISO } from 'date-fns'
import { CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react'

export function MyBookings() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          desks (
            name,
            equipment,
            floors (
              name,
              locations (
                name,
                address
              )
            )
          )
        `)
        .eq('user_id', profile.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['upcoming-bookings'] })
    },
  })

  const checkInMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      // Update reservation status
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'checked_in' })
        .eq('id', bookingId)

      if (updateError) throw updateError

      // Create check-in record
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          reservation_id: bookingId,
          checked_in_at: new Date().toISOString(),
        })

      if (checkInError) throw checkInError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['upcoming-bookings'] })
    },
  })

  const getStatusBadge = (status: string, bookingDate: string) => {
    const isPastDate = isPast(parseISO(bookingDate))
    const isToday = format(parseISO(bookingDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
          <XCircle className="h-3 w-3" />
          Cancelled
        </span>
      )
    }
    if (status === 'checked_in') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
          <CheckCircle2 className="h-3 w-3" />
          Checked In
        </span>
      )
    }
    if (isPastDate && status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
          <Clock className="h-3 w-3" />
          Completed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
        <CheckCircle2 className="h-3 w-3" />
        Confirmed
      </span>
    )
  }

  const canCheckIn = (booking: any) => {
    const isToday = format(parseISO(booking.booking_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    return isToday && booking.status === 'confirmed'
  }

  const canCancel = (booking: any) => {
    const bookingDateTime = parseISO(`${booking.booking_date}T${booking.start_time}`)
    return !isPast(bookingDateTime) && booking.status !== 'cancelled'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all your workspace reservations
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>
      ) : bookings && bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking: any) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">
                        {booking.desks?.name}
                      </h3>
                      {getStatusBadge(booking.status, booking.booking_date)}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {booking.desks?.floors?.locations?.name} - {booking.desks?.floors?.name}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(booking.booking_date), 'EEEE, MMMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.start_time}
                      {booking.end_time && ` - ${booking.end_time}`}
                      {!booking.end_time && ' (Full Day)'}
                    </div>
                    {booking.desks?.equipment && booking.desks.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {booking.desks.equipment.map((eq: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {canCheckIn(booking) && (
                      <Button
                        size="sm"
                        onClick={() => checkInMutation.mutate(booking.id)}
                        disabled={checkInMutation.isPending}
                      >
                        Check In
                      </Button>
                    )}
                    {canCancel(booking) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this booking?')) {
                            cancelMutation.mutate(booking.id)
                          }
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No bookings found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

