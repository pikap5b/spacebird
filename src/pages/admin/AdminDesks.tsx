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

export function AdminDesks() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDesk, setEditingDesk] = useState<any>(null)
  const [floorId, setFloorId] = useState('')
  const [name, setName] = useState('')
  const [gridRow, setGridRow] = useState(1)
  const [gridCol, setGridCol] = useState(1)
  const [capacity, setCapacity] = useState(1)
  const [equipment, setEquipment] = useState('')

  const { data: floors } = useQuery({
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

  const selectedFloor = floors?.find((f) => f.id === floorId)

  const { data: desks, isLoading } = useQuery({
    queryKey: ['desks', floorId],
    queryFn: async () => {
      if (!floorId) return []
      const { data, error } = await supabase
        .from('desks')
        .select(`
          *,
          floors (
            name,
            locations (
              name
            )
          )
        `)
        .eq('floor_id', floorId)
        .order('name')
      if (error) throw error
      return data || []
    },
    enabled: !!floorId,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const equipmentArray = equipment
        ? equipment.split(',').map((e) => e.trim()).filter(Boolean)
        : null

      const { data, error } = await supabase
        .from('desks')
        .insert({
          floor_id: floorId,
          name,
          grid_row: gridRow,
          grid_col: gridCol,
          capacity,
          equipment: equipmentArray,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desks'] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingDesk) return
      const equipmentArray = equipment
        ? equipment.split(',').map((e) => e.trim()).filter(Boolean)
        : null

      const { data, error } = await supabase
        .from('desks')
        .update({
          floor_id: floorId,
          name,
          grid_row: gridRow,
          grid_col: gridCol,
          capacity,
          equipment: equipmentArray,
        })
        .eq('id', editingDesk.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desks'] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('desks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desks'] })
    },
  })

  const resetForm = () => {
    setFloorId('')
    setName('')
    setGridRow(1)
    setGridCol(1)
    setCapacity(1)
    setEquipment('')
    setEditingDesk(null)
    setDialogOpen(false)
  }

  const handleEdit = (desk: any) => {
    setEditingDesk(desk)
    setFloorId(desk.floor_id)
    setName(desk.name)
    setGridRow(desk.grid_row)
    setGridCol(desk.grid_col)
    setCapacity(desk.capacity)
    setEquipment(desk.equipment ? desk.equipment.join(', ') : '')
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingDesk) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Desk Management</h1>
          <p className="text-muted-foreground mt-1">
            Add, edit, and remove desks on floors
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Desk
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Floor</CardTitle>
          <CardDescription>Select a floor to view and manage its desks</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={floorId} onChange={(e) => setFloorId(e.target.value)}>
            <option value="">Select a floor</option>
            {floors?.map((floor: any) => (
              <option key={floor.id} value={floor.id}>
                {floor.locations?.name} - {floor.name}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading desks...</div>
      ) : desks && desks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Desks on {selectedFloor?.name}</CardTitle>
            <CardDescription>Manage desks and their positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {desks.map((desk: any) => (
                <div
                  key={desk.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{desk.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Position: Row {desk.grid_row}, Col {desk.grid_col} • Capacity: {desk.capacity}
                    </div>
                    {desk.equipment && desk.equipment.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Equipment: {desk.equipment.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(desk)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${desk.name}?`)) {
                          deleteMutation.mutate(desk.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : floorId ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No desks found for this floor</p>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDesk ? 'Edit Desk' : 'Add New Desk'}</DialogTitle>
            <DialogDescription>
              {editingDesk
                ? 'Update the desk details and position'
                : 'Create a new desk and set its position on the floor grid'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Floor *</Label>
              <Select
                id="floor"
                value={floorId}
                onChange={(e) => setFloorId(e.target.value)}
                required
              >
                <option value="">Select a floor</option>
                {floors?.map((floor: any) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.locations?.name} - {floor.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Desk Name/Number *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Desk A1, Workstation 5"
                required
              />
            </div>
            {selectedFloor && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gridRow">
                    Grid Row * (1-{selectedFloor.grid_rows})
                  </Label>
                  <Input
                    id="gridRow"
                    type="number"
                    min="1"
                    max={selectedFloor.grid_rows}
                    value={gridRow}
                    onChange={(e) => setGridRow(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gridCol">
                    Grid Column * (1-{selectedFloor.grid_cols})
                  </Label>
                  <Input
                    id="gridCol"
                    type="number"
                    min="1"
                    max={selectedFloor.grid_cols}
                    value={gridCol}
                    onChange={(e) => setGridCol(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment (comma-separated)</Label>
              <Input
                id="equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g., Monitor, Standing Desk, Keyboard"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !floorId ||
                !name ||
                !gridRow ||
                !gridCol ||
                !capacity ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editingDesk ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

