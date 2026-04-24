import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, LayoutGrid, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { roomAPI } from '../services/api';

export function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    room_no: '',
    capacity: 30,
    rows_count: 5,
    cols_count: 6,
    floor: '',
    block: ''
  });

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data.rooms || []);
    } catch (err) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Update capacity automatically when rows/cols change
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      capacity: prev.rows_count * prev.cols_count
    }));
  }, [form.rows_count, form.cols_count]);

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingId(room.id);
      setForm({ ...room });
    } else {
      setEditingId(null);
      setForm({
        room_no: '', capacity: 30, rows_count: 5, cols_count: 6, floor: '', block: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const savePromise = editingId 
      ? roomAPI.update(editingId, form)
      : roomAPI.create(form);

    toast.promise(savePromise, {
      loading: 'Saving...',
      success: 'Room saved successfully',
      error: (err) => err.response?.data?.message || 'Failed to save room'
    }).then(() => {
      fetchRooms();
      setIsModalOpen(false);
    });
  };

  const handleDelete = async (id, room_no) => {
    if (!window.confirm(`Delete room ${room_no}?`)) return;
    try {
      await roomAPI.delete(id);
      toast.success('Room deleted');
      fetchRooms();
    } catch (err) {
      toast.error('Failed to delete room');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title">Exam Rooms</h1>
          <p className="page-subtitle">Configure rooms and their seating grids for exams</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Add Room
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="spin text-accent" size={32} /></div>
      ) : rooms.length === 0 ? (
        <div className="empty-state border border-dashed border-custom rounded-xl">
          <LayoutGrid className="empty-state-icon mx-auto text-muted" size={48} />
          <div className="empty-state-text mb-4">No rooms configured yet.</div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>Add First Room</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="card relative group overflow-hidden">
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="p-1.5 rounded-md bg-surface2 text-muted hover:text-accent transition-colors"
                  onClick={() => handleOpenModal(room)}
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  className="p-1.5 rounded-md bg-surface2 text-muted hover:text-danger transition-colors"
                  onClick={() => handleDelete(room.id, room.room_no)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-surface2 border border-custom flex items-center justify-center font-bold text-accent">
                  {room.room_no}
                </div>
                <div>
                  <div className="text-sm font-semibold">{[room.block, room.floor].filter(Boolean).join(' • ') || 'No Location'}</div>
                  <div className="text-xs text-muted">ID: {room.id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-bg rounded-lg p-2 text-center border border-custom">
                  <div className="text-xs text-muted mb-1">Capacity</div>
                  <div className="font-bold text-lg leading-none">{room.capacity}</div>
                </div>
                <div className="bg-bg rounded-lg p-2 text-center border border-custom">
                  <div className="text-xs text-muted mb-1">Grid</div>
                  <div className="font-bold text-sm leading-none mt-1 text-accent-light">
                    {room.rows_count} × {room.cols_count}
                  </div>
                </div>
              </div>

              {/* Visual mini-grid representation */}
              <div className="flex flex-col gap-[2px] opacity-40">
                {Array.from({ length: Math.min(room.rows_count, 6) }).map((_, r) => (
                  <div key={r} className="flex gap-[2px] justify-center">
                    {Array.from({ length: Math.min(room.cols_count, 12) }).map((_, c) => (
                      <div key={c} className="w-2 h-2 rounded-[1px] bg-accent-dark"></div>
                    ))}
                    {room.cols_count > 12 && <div className="text-[8px] leading-none text-muted">...</div>}
                  </div>
                ))}
                {room.rows_count > 6 && <div className="text-center text-[10px] leading-none text-muted mt-1">...</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Edit Room' : 'Add New Room'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Room Number *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={form.room_no} 
                  onChange={e => setForm({...form, room_no: e.target.value})}
                  placeholder="e.g. 101, A-205"
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Grid Rows *</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={form.rows_count} 
                    onChange={e => setForm({...form, rows_count: parseInt(e.target.value) || 0})}
                    min="1"
                    required 
                  />
                  <p className="text-[10px] text-muted mt-1">Number of rows in room</p>
                </div>
                <div className="form-group">
                  <label className="label">Grid Columns *</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={form.cols_count} 
                    onChange={e => setForm({...form, cols_count: parseInt(e.target.value) || 0})}
                    min="1"
                    required 
                  />
                  <p className="text-[10px] text-muted mt-1">Seats per row</p>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Total Capacity</label>
                <input 
                  type="number" 
                  className="input cursor-not-allowed" 
                  value={form.capacity} 
                  disabled
                />
                <p className="text-[10px] text-accent-light mt-1">Auto-calculated: Rows × Columns</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Block/Building (Optional)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.block} 
                    onChange={e => setForm({...form, block: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Floor (Optional)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={form.floor} 
                    onChange={e => setForm({...form, floor: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-custom">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
