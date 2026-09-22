import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Users, Loader2, Mail, Phone,
  Building2, Search, AlertTriangle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { teacherAPI } from '../services/api';

export function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmTeacher, setDeleteConfirmTeacher] = useState(null);

  const [form, setForm] = useState({
    name: '',
    department: '',
    email: '',
    contact: '',
  });

  const fetchTeachers = async () => {
    try {
      const res = await teacherAPI.getAll();
      setTeachers(res.data.teachers || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load invigilators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setEditingId(teacher.id);
      setForm({
        name: teacher.name || '',
        department: teacher.department || '',
        email: teacher.email || '',
        contact: teacher.contact || '',
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        department: 'Computer Science & Engineering',
        email: '',
        contact: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return toast.error('Faculty member name is required');
    }

    const savePromise = editingId
      ? teacherAPI.update(editingId, form)
      : teacherAPI.create(form);

    toast.promise(savePromise, {
      loading: 'Saving invigilator details...',
      success: editingId ? 'Invigilator updated successfully' : 'Invigilator added successfully',
      error: (err) => err.response?.data?.message || 'Failed to save invigilator',
    }).then(() => {
      fetchTeachers();
      setIsModalOpen(false);
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmTeacher) return;
    try {
      await teacherAPI.delete(deleteConfirmTeacher.id);
      toast.success(`Removed "${deleteConfirmTeacher.name}"`);
      setDeleteConfirmTeacher(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invigilator');
    }
  };

  const departments = [...new Set(teachers.map((t) => t.department).filter(Boolean))];

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      (t.department && t.department.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q));

    const matchesDept = !selectedDept || t.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-indigo-400" />
            Faculty & Invigilators Directory
          </h1>
          <p className="page-subtitle text-xs text-slate-400">
            Maintain authorized faculty members for examination hall invigilation and duty assignments.
          </p>
        </div>

        <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Add Invigilator
        </button>
      </div>

      {/* Control Bar: Search & Department Filter */}
      <div className="card !p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="search-bar flex-1 min-w-[240px]">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input text-xs"
            placeholder="Search by faculty name, department, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            className="input !w-auto text-xs py-2 bg-surface2"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Academic Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <div className="text-xs text-slate-400 whitespace-nowrap pl-2">
            Total: <strong className="text-white">{filteredTeachers.length}</strong> Faculty
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="spin text-indigo-400" size={32} />
          <span className="text-xs">Loading faculty invigilators...</span>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="empty-state card border-dashed border-slate-700 p-12 text-center">
          <Users className="empty-state-icon mx-auto text-slate-600 mb-3" size={48} />
          <h3 className="text-base font-semibold text-slate-200 mb-1">No Invigilators Found</h3>
          <p className="text-xs text-slate-400 mb-4">
            {search || selectedDept
              ? 'No faculty members match your filter criteria.'
              : 'Add faculty members to assign them to exam halls during seating generation.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
            <Plus size={14} /> Add First Invigilator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="card relative group hover:border-indigo-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600/30 to-indigo-900/40 border border-indigo-500/30 flex items-center justify-center font-bold text-base text-indigo-300 uppercase shadow-inner">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{teacher.name}</h3>
                      <span className="badge badge-purple text-[10px] mt-0.5">
                        {teacher.department || 'Faculty on Duty'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded-md hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 transition-colors"
                      onClick={() => handleOpenModal(teacher)}
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      onClick={() => setDeleteConfirmTeacher(teacher)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mt-3 pt-3 border-t border-custom text-xs">
                  {teacher.department && (
                    <div className="flex items-center gap-2 text-slate-300 truncate">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{teacher.department}</span>
                    </div>
                  )}
                  {teacher.email && (
                    <div className="flex items-center gap-2 text-slate-300 truncate">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                  )}
                  {teacher.contact && (
                    <div className="flex items-center gap-2 text-slate-300 truncate">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{teacher.contact}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Teacher */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box !max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-custom">
              <h2 className="modal-title flex items-center gap-2">
                <Users className="text-indigo-400" size={20} />
                {editingId ? 'Edit Invigilator Record' : 'Add New Faculty Invigilator'}
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
                <label className="label">Faculty Full Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Prof. Alan Turing, Dr. Jane Foster"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Department / School *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Computer Science & Engineering, Physics"
                  value={form.department}
                  onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Official Email Address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="faculty@apex.edu"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Contact / Phone Number</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. +91 98765 43210"
                    value={form.contact}
                    onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-custom">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingId ? 'Save Changes' : 'Add Invigilator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTeacher && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmTeacher(null)}>
          <div className="modal-box !max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Delete Invigilator?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Remove <strong className="text-white">{deleteConfirmTeacher.name}</strong> ({deleteConfirmTeacher.department}) from the invigilators directory?
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmTeacher(null)}>
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
