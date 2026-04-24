import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Loader2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Input, Label } from "../../components/ui/Input";
import { roomAPI } from "../../services/api";

export function RoomManager() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ room_no: "", capacity: 30, benches: 15, floor: "", block: "", teacher_name: "" });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data.rooms || []);
    } catch (err) {
      toast.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await roomAPI.update(editingId, formData);
        toast.success("Room updated successfully");
      } else {
        await roomAPI.create(formData);
        toast.success("Room created successfully");
      }
      setEditingId(null);
      setFormData({ room_no: "", capacity: 30, benches: 15, floor: "", block: "", teacher_name: "" });
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save room");
    }
  };

  const handleEdit = (room) => {
    setEditingId(room.id);
    setFormData({
      room_no: room.room_no,
      capacity: room.capacity,
      benches: room.benches,
      floor: room.floor || "",
      block: room.block || "",
      teacher_name: room.teacher_name || ""
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await roomAPI.delete(id);
      toast.success("Room deleted successfully");
      fetchRooms();
    } catch (err) {
      toast.error("Failed to delete room");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ room_no: "", capacity: 30, benches: 15, floor: "", block: "", teacher_name: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Room Manager</h1>
        <p className="text-slate-500 dark:text-slate-400">Add, update, or remove exam rooms.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Room" : "Add New Room"}</CardTitle>
            <CardDescription>Enter room capacity and details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room_no">Room Number *</Label>
                <Input
                  id="room_no"
                  required
                  value={formData.room_no}
                  onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="benches">Benches *</Label>
                  <Input
                    id="benches"
                    type="number"
                    min="1"
                    required
                    value={formData.benches}
                    onChange={(e) => setFormData({ ...formData, benches: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block">Block</Label>
                  <Input
                    id="block"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher_name">Evaluator / Teacher Name</Label>
                <Input
                  id="teacher_name"
                  placeholder="Ex: Prof. Robert J."
                  value={formData.teacher_name}
                  onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                />
              </div>
              <div className="pt-2 flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingId ? "Save Changes" : "Add Room"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rooms List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 flex justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : rooms.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No rooms found. Add one to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room No</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Benches</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-semibold">{room.room_no}</TableCell>
                        <TableCell>{room.capacity}</TableCell>
                        <TableCell>{room.benches}</TableCell>
                        <TableCell>{[room.floor, room.block].filter(Boolean).join(", ") || "-"}</TableCell>
                        <TableCell className="font-medium text-indigo-600 dark:text-indigo-400">{room.teacher_name || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(room)}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(room.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
