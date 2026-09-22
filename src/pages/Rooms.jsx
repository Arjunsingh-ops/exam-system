import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, LayoutGrid, List, Loader2,
  Search, DoorClosed, AlertTriangle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { roomAPI } from '../services/api';

export function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [form, setForm] = useState({
    room_no: '',
    capacity: 30,
    rows_count: 5,
    cols_count: 6,
    floor: '',
    block: '',
  });

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll();
      setRooms(res.data.rooms || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Update capacity automatically when rows or columns change
  const handleRowsChange = (rows) => {
    const r = Math.max(1, parseInt(rows, 10) || 1);
    setForm((prev) => ({
      ...prev,
      rows_count: r,
      capacity: r * prev.cols_count,
    }));
  };

  const handleColsChange = (cols) => {
    const c = Math.max(1, parseInt(cols, 10) || 1);
    setForm((prev) => ({
      ...prev,
      cols_count: c,
      capacity: prev.rows_count * c,
    }));
  };

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingId(room.id);
      setForm({
        room_no: room.room_no || '',
        capacity: room.capacity || 30,
        rows_count: room.rows_count || 5,
        cols_count: room.cols_count || 6,
        floor: room.floor || '',
        block: room.block || '',
      });
    } else {
      setEditingId(null);
      setForm({
        room_no: '',
        capacity: 30,
        rows_count: 5,
        cols_count: 6,
        floor: 'Ground Floor',
        block: 'Block A',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_no.trim()) {
      return toast.error('Room number is required');
    }

    const savePromise = editingId
      ? roomAPI.update(editingId, form)
      : roomAPI.create(form);

    toast.promise(savePromise, {
      loading: 'Saving room configuration...',
      success: editingId ? 'Room updated successfully' : 'Room created successfully',
      error: (err) => err.response?.data?.message || 'Failed to save room',
    }).then(() => {
      fetchRooms();
      setIsModalOpen(false);
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await roomAPI.delete(deleteConfirmId);
      toast.success('Room deleted successfully');
      setDeleteConfirmId(null);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.room_no.toLowerCase().includes(q) ||
      (r.block && r.block.toLowerCase().includes(q)) ||
      (r.floor && r.floor.toLowerCase().includes(q))
    );
  });

  const totalSeats = rooms.reduce((sum, r) => sum + (parseInt(r.capacity, 10) || 0), 0);

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-white flex items-center gap-2">
            <DoorClosed className="text-indigo-400" />
            Examination Halls & Rooms
          </h1>
          <p className="page-subtitle text-xs text-slate-400">
            Configure hall dimensions, rows, columns, and total student capacities for seating allocations.
          </p>
        </div>

        <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Add Examination Room
        </button>
      </div>

      {/* Control Bar: Search + Stats + View Mode */}
      <div className="card !p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="search-bar w-full sm:w-80">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input text-xs"
            placeholder="Search by room number, block, or floor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white">{filteredRooms.length}</span> Room(s) | <span className="font-semibold text-emerald-400">{totalSeats}</span> Total Capacity
          </div>

          <div className="flex items-center bg-surface2 rounded-lg p-1 border border-custom">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
              className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table View"
              className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="spin text-indigo-400" size={32} />
          <span className="text-xs">Loading examination rooms...</span>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="empty-state card border-dashed border-slate-700 p-12 text-center">
          <LayoutGrid className="empty-state-icon mx-auto text-slate-600 mb-3" size={48} />
          <h3 className="text-base font-semibold text-slate-200 mb-1">No Examination Rooms Found</h3>
          <p className="text-xs text-slate-400 mb-4">
            {search ? 'No rooms match your filter query.' : 'Configure your campus examination halls to start assigning seating.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
            <Plus size={14} /> Add First Room
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <div key={room.id} className="card relative group hover:border-indigo-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center font-extrabold text-base text-indigo-300">
                      {room.room_no}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Room {room.room_no}</h3>
                      <p className="text-[11px] text-slate-400">
                        {[room.block ? 'Block ' + room.block : '', room.floor ? room.floor : ''].filter(Boolean).join(' • ') || 'Main Campus'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded-md hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition-colors"
                      onClick={() => handleOpenModal(room)}
                      title="Edit Room"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      onClick={() => setDeleteConfirmId(room.id)}
                      title="Delete Room"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="bg-[#090d17] p-2.5 rounded-lg border border-custom text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Capacity</span>
                    <span className="text-lg font-extrabold text-white">{room.capacity}</span>
                    <span className="text-[10px] text-slate-400 block">seats</span>
                  </div>
                  <div className="bg-[#090d17] p-2.5 rounded-lg border border-custom text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Grid</span>
                    <span className="text-sm font-bold text-indigo-300 block mt-1">
                      {room.rows_count} R × {room.cols_count} C
                    </span>
                    <span className="text-[10px] text-slate-400 block">matrix</span>
                  </div>
                </div>
              </div>

              {/* Mini visual seating preview */}
              <div className="pt-2 border-t border-custom">
                <div className="flex flex-col gap-1 p-2 bg-[#090d17] rounded-md border border-custom/60 overflow-hidden">
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest text-center font-bold pb-0.5">Chalkboard / Podium</div>
                  {Array.from({ length: Math.min(room.rows_count, 4) }).map((_, r) => (
                    <div key={r} className="flex gap-1 justify-center">
                      {Array.from({ length: Math.min(room.cols_count, 8) }).map((_, c) => (
                        <span key={c} className="w-2.5 h-2 rounded-[2px] bg-indigo-500/30 border border-indigo-400/20" />
                      ))}
                    </div>
                  ))}
                  {room.rows_count > 4 && (
                    <div className="text-[8px] text-slate-400 text-center font-mono">+ {room.rows_count - 4} more rows</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Location Details</th>
                <th>Capacity</th>
                <th>Grid Dimensions</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room.id}>
                  <td>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="w-7 h-7 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-mono font-bold">
                        {room.room_no}
                      </span>
                      Room {room.room_no}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-slate-300">
                      {[room.block ? 'Block ' + room.block : '', room.floor ? room.floor : ''].filter(Boolean).join(' • ') || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-green font-mono">{room.capacity} seats</span>
                  </td>
                  <td>
                    <span className="badge badge-purple font-mono">{room.rows_count} × {room.cols_count}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn btn-ghost btn-sm p-1.5"
                        onClick={() => handleOpenModal(room)}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm p-1.5"
                        onClick={() => setDeleteConfirmId(room.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add / Edit Room with Real-Time Matrix Preview */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box !max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-custom">
              <h2 className="modal-title flex items-center gap-2">
                <DoorClosed className="text-indigo-400" size={20} />
                {editingId ? 'Edit Examination Room' : 'Configure New Examination Room'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label">Room Number / Identification *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 101, LH-3, Hall-A"
                  value={form.room_no}
                  onChange={(e) => setForm((p) => ({ ...p, room_no: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Block / Building</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Science Block, Academic Wing B"
                    value={form.block}
                    onChange={(e) => setForm((p) => ({ ...p, block: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Floor Level</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 1st Floor, Ground Floor"
                    value={form.floor}
                    onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
                  />
                </div>
              </div>

              {/* Grid Dimensions */}
              <div className="p-4 rounded-xl bg-surface2/70 border border-custom space-y-3">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Seating Grid Architecture
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label text-[11px]">Rows Count</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="input font-mono text-center"
                      value={form.rows_count}
                      onChange={(e) => handleRowsChange(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-[11px]">Columns Count</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="input font-mono text-center"
                      value={form.cols_count}
                      onChange={(e) => handleColsChange(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-[11px]">Computed Capacity</label>
                    <div className="h-[38px] flex items-center justify-center font-bold text-emerald-400 bg-[#0b0f19] border border-custom rounded-lg font-mono">
                      {form.capacity} seats
                    </div>
                  </div>
                </div>

                {/* Real-time matrix visualizer */}
                <div className="pt-2">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 flex justify-between">
                    <span>Hall Grid Layout Preview</span>
                    <span className="text-indigo-400 font-mono">{form.rows_count} × {form.cols_count} = {form.capacity}</span>
                  </div>
                  <div className="p-3 bg-[#090d17] rounded-lg border border-custom max-h-36 overflow-auto custom-scroll flex flex-col items-center gap-1">
                    <div className="text-[8.5px] uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-700/50 pb-0.5 w-full text-center">
                      [ Front Instructor Desk / Podium ]
                    </div>
                    {Array.from({ length: Math.min(form.rows_count, 12) }).map((_, r) => (
                      <div key={r} className="flex gap-1 items-center">
                        <span className="text-[8px] text-slate-400 font-mono w-4 text-right mr-1">R{r + 1}</span>
                        {Array.from({ length: Math.min(form.cols_count, 16) }).map((_, c) => (
                          <span
                            key={c}
                            className="w-4 h-3.5 rounded-[3px] bg-indigo-600/30 border border-indigo-400/40 text-[7px] text-indigo-300 font-mono flex items-center justify-center"
                            title={`Seat R${r + 1}-C${c + 1}`}
                          >
                            {c + 1}
                          </span>
                        ))}
                      </div>
                    ))}
                    {(form.rows_count > 12 || form.cols_count > 16) && (
                      <div className="text-[9px] text-slate-400 italic mt-1">
                        Display truncated for preview ({form.rows_count} rows, {form.cols_count} cols)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-custom">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingId ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-box !max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Delete Examination Room?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Are you sure you want to delete this room? Any active seating plans referencing this room may be impacted.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
