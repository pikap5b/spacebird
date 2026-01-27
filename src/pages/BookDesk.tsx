import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { Calendar, MapPin, Layers, Grid, List, Map } from 'lucide-react'
import { TimelineView } from '@/components/TimelineView'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export function BookDesk() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null)
  const [spaceType, setSpaceType] = useState<string>('All')
  const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'list'>('timeline')

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

  // Auto-select first location if available
  if (locations && locations.length > 0 && !selectedLocation) {
    setSelectedLocation(locations[0].id)
  }

  const spaceTypes = ['All', 'Desks', 'Meeting rooms', 'Parking spots', 'Others']

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Book a space</h1>

        {/* Space Type Tabs */}
        <div className="flex gap-1 mb-4">
          {spaceTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSpaceType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                spaceType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-auto"
            />
            <span className="text-sm text-gray-600">
              {format(selectedDate, 'EEEE, MMM dd, yyyy')}
            </span>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <Select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value)
                setSelectedFloor(null)
              }}
              className="w-48"
            >
              <option value="">Select location</option>
              {locations?.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Floor Filter */}
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-500" />
            <Select
              value={selectedFloor || ''}
              onChange={(e) => setSelectedFloor(e.target.value || null)}
              className="w-40"
              disabled={!selectedLocation}
            >
              <option value="">All floors</option>
              {floors?.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </Select>
          </div>

          {/* View Mode Controls */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded ${
                viewMode === 'timeline'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Timeline view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Grid view"
            >
              <Map className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {!selectedLocation ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Please select a location to view available spaces
          </div>
        ) : viewMode === 'timeline' ? (
          <TimelineView
            selectedDate={selectedDate}
            selectedLocation={selectedLocation}
            selectedFloor={selectedFloor}
            spaceType={spaceType}
          />
        ) : (
          <div className="text-center text-gray-500 py-12">
            {viewMode === 'grid' ? 'Grid view coming soon' : 'List view coming soon'}
          </div>
        )}
      </div>
    </div>
  )
}
