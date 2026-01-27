import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { BarChart3, TrendingUp, Calendar, Users } from 'lucide-react'

export function AdminReports() {
  const today = new Date()
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  const { data: weeklyStats, isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .gte('booking_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(weekEnd, 'yyyy-MM-dd'))

      if (error) throw error

      const total = data?.length || 0
      const confirmed = data?.filter((r) => r.status === 'confirmed').length || 0
      const checkedIn = data?.filter((r) => r.status === 'checked_in').length || 0
      const cancelled = data?.filter((r) => r.status === 'cancelled').length || 0

      return { total, confirmed, checkedIn, cancelled }
    },
  })

  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .gte('booking_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('booking_date', format(monthEnd, 'yyyy-MM-dd'))

      if (error) throw error

      const total = data?.length || 0
      const confirmed = data?.filter((r) => r.status === 'confirmed').length || 0
      const checkedIn = data?.filter((r) => r.status === 'checked_in').length || 0
      const cancelled = data?.filter((r) => r.status === 'cancelled').length || 0

      return { total, confirmed, checkedIn, cancelled }
    },
  })

  const { data: popularDesks, isLoading: popularLoading } = useQuery({
    queryKey: ['popular-desks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          desk_id,
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
        .gte('booking_date', format(subDays(today, 30), 'yyyy-MM-dd'))

      if (error) throw error

      const deskCounts: Record<string, any> = {}
      data?.forEach((reservation: any) => {
        const deskId = reservation.desk_id
        if (!deskCounts[deskId]) {
          deskCounts[deskId] = {
            count: 0,
            desk: reservation.desks,
          }
        }
        deskCounts[deskId].count++
      })

      return Object.entries(deskCounts)
        .map(([deskId, data]: [string, any]) => ({
          deskId,
          count: data.count,
          desk: data.desk,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    },
  })

  const { data: recentBookings, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-bookings'],
    queryFn: async () => {
      const { data: reservationsData, error } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Fetch user data separately
      const userIds = [...new Set(reservationsData?.map((r: any) => r.user_id) || [])]
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', userIds)

      // Combine the data
      const data = reservationsData?.map((reservation: any) => ({
        ...reservation,
        users: usersData?.find((u: any) => u.id === reservation.user_id),
      }))

      return data || []
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          View booking trends and system usage statistics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Statistics
            </CardTitle>
            <CardDescription>Bookings for this week</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyLoading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Bookings:</span>
                  <span className="font-semibold">{weeklyStats?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmed:</span>
                  <span className="font-semibold text-green-600">{weeklyStats?.confirmed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Checked In:</span>
                  <span className="font-semibold text-blue-600">{weeklyStats?.checkedIn || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cancelled:</span>
                  <span className="font-semibold text-red-600">{weeklyStats?.cancelled || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Statistics
            </CardTitle>
            <CardDescription>Bookings for this month</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Bookings:</span>
                  <span className="font-semibold">{monthlyStats?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmed:</span>
                  <span className="font-semibold text-green-600">{monthlyStats?.confirmed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Checked In:</span>
                  <span className="font-semibold text-blue-600">{monthlyStats?.checkedIn || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cancelled:</span>
                  <span className="font-semibold text-red-600">{monthlyStats?.cancelled || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Most Popular Desks (Last 30 Days)
          </CardTitle>
          <CardDescription>Top booked desks</CardDescription>
        </CardHeader>
        <CardContent>
          {popularLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : popularDesks && popularDesks.length > 0 ? (
            <div className="space-y-2">
              {popularDesks.map((item: any, index: number) => (
                <div
                  key={item.deskId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      #{index + 1} {item.desk?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.desk?.floors?.locations?.name} - {item.desk?.floors?.name}
                    </div>
                  </div>
                  <div className="text-lg font-semibold">{item.count} bookings</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No booking data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Bookings
          </CardTitle>
          <CardDescription>Latest booking activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : recentBookings && recentBookings.length > 0 ? (
            <div className="space-y-2">
              {recentBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {booking.users?.full_name || booking.users?.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.desks?.name} • {booking.desks?.floors?.locations?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(booking.booking_date), 'MMM dd, yyyy')} • {booking.start_time}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span
                      className={`px-2 py-1 rounded ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'checked_in'
                          ? 'bg-blue-100 text-blue-700'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No recent bookings
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

