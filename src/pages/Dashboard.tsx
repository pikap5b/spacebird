import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Clock } from 'lucide-react'
import { format } from 'date-fns'

export function Dashboard() {
  const { profile } = useAuth()

  const { data: upcomingBookings, isLoading } = useQuery({
    queryKey: ['upcoming-bookings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          desks (
            name,
            floors (
              name,
              locations (
                name
              )
            )
          )
        `)
        .eq('user_id', profile.id)
        .gte('booking_date', today)
        .in('status', ['confirmed', 'checked_in'])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5)

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">
            Overview of your upcoming bookings
          </p>
        </div>
        <Link to="/book">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Book a Space
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Bookings
            </CardTitle>
            <CardDescription>
              Your next workspace reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : upcomingBookings && upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">
                      {booking.desks?.floors?.locations?.name} - {booking.desks?.name}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {booking.start_time}
                      {booking.end_time && ` - ${booking.end_time}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-4">
                No upcoming bookings
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/book" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Book a New Space
              </Button>
            </Link>
            <Link to="/bookings" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View All Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
