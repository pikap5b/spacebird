import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export function AdminFloors() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFloor, setEditingFloor] = useState<any>(null)
  const [locationId, setLocationId] = useState('')
  const [name, setName] = useState('')
  const [gridRows, setGridRows] = useState(5)
  const [gridCols, setGridCols] = useState(5)

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

  const { data: floors, isLoading } = useQuery({
    queryKey: ['floors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select(`
          *,
          locations (
            name
          )
        `)
        .order('name')
      if (error) throw error
      return data || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .insert({ location_id: locationId, name, grid_rows: gridRows, grid_cols: gridCols })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingFloor) return
      const { data, error } = await supabase
        .from('floors')
        .update({ location_id: locationId, name, grid_rows: gridRows, grid_cols: gridCols })
        .eq('id', editingFloor.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('floors').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] })
    },
  })

  const resetForm = () => {
    setLocationId('')
    setName('')
    setGridRows(5)
    setGridCols(5)
    setEditingFloor(null)
    setDialogOpen(false)
  }

  const handleEdit = (floor: any) => {
    setEditingFloor(floor)
    setLocationId(floor.location_id)
    setName(floor.name)
    setGridRows(floor.grid_rows)
    setGridCols(floor.grid_cols)
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingFloor) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Floor Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage floors within locations
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Floor
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading floors...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Floors</CardTitle>
            <CardDescription>Manage floors and their grid layouts</CardDescription>
          </CardHeader>
          <CardContent>
            {floors && floors.length > 0 ? (
              <div className="space-y-2">
                {floors.map((floor: any) => (
                  <div
                    key={floor.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{floor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {floor.locations?.name} • Grid: {floor.grid_rows} × {floor.grid_cols}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(floor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${floor.name}?`)) {
                            deleteMutation.mutate(floor.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No floors found. Create your first floor to get started.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFloor ? 'Edit Floor' : 'Add New Floor'}</DialogTitle>
            <DialogDescription>
              {editingFloor
                ? 'Update the floor details and grid layout'
                : 'Create a new floor with a grid layout'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select
                id="location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Floor 1, East Wing"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gridRows">Grid Rows *</Label>
                <Input
                  id="gridRows"
                  type="number"
                  min="1"
                  max="20"
                  value={gridRows}
                  onChange={(e) => setGridRows(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gridCols">Grid Columns *</Label>
                <Input
                  id="gridCols"
                  type="number"
                  min="1"
                  max="20"
                  value={gridCols}
                  onChange={(e) => setGridCols(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !locationId ||
                !name ||
                !gridRows ||
                !gridCols ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editingFloor ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

