import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Loader2, Mail, Phone, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { teacherAPI } from '../services/api';

export function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '', department: '', email: '', contact: ''
  });

  const fetchTeachers = async () => {
    try {
      const res = await teacherAPI.getAll();
      setTeachers(res.data.teachers || []);
    } catch (err) {
      toast.error('Failed to load teachers');
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
      setForm({ ...teacher });
    } else {
      setEditingId(null);
      setForm({ name: '', department: '', email: '', contact: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const savePromise = editingId 
      ? teacherAPI.update(editingId, form)
      : teacherAPI.create(form);

    toast.promise(savePromise, {
      loading: 'Saving...',
      success: 'Teacher saved successfully',
      error: (err) => err.response?.data?.message || 'Failed to save teacher'
    }).then(() => {
      fetchTeachers();
      setIsModalOpen(false);
    });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"?`)) return;
    try {
      await teacherAPI.delete(id);
      toast.success('Teacher deleted');
      fetchTeachers();
    } catch (err) {
      toast.error('Failed to delete teacher');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title">Invigilators Directory</h1>
          <p className="page-subtitle">Manage teachers for exam invigilation duties</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="spin text-accent" size={32} /></div>
      ) : teachers.length === 0 ? (
        <div className="empty-state border border-dashed border-custom rounded-xl">
          <Users className="empty-state-icon mx-auto text-muted" size={48} />
          <div className="empty-state-text mb-4">No teachers added yet.</div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>Add First Teacher</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(teacher => (
            <div key={teacher.id} className="card relative group flex gap-4 pr-10">
              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-muted hover:text-accent p-1" onClick={() => handleOpenModal(teacher)}>
                  <Edit2 size={15} />
                </button>
                <button className="text-muted hover:text-danger p-1" onClick={() => handleDelete(teacher.id, teacher.name)}>
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Avatar circle */}
              <div className="w-12 h-12 shrink-0 rounded-full bg-surface2 border border-custom flex items-center justify-center font-bold text-lg text-accent-light uppercase">
                {teacher.name.charAt(0)}
              </div>

              {/* Details */}
              <div className="min-w-0">
                <h3 className="font-semibold text-[15px] text-text truncate mb-1">{teacher.name}</h3>
                
                <div className="space-y-1.5 mt-3">
                  {teacher.department && (
                    <div className="flex items-center gap-2 text-xs text-muted truncate">
                      <Building2 size={12} className="shrink-0" /> {teacher.department}
                    </div>
                  )}
                  {teacher.email && (
                    <div className="flex items-center gap-2 text-xs text-muted truncate">
                      <Mail size={12} className="shrink-0" /> {teacher.email}
                    </div>
                  )}
                  {teacher.contact && (
                    <div className="flex items-center gap-2 text-xs text-muted truncate">
                      <Phone size={12} className="shrink-0" /> {teacher.contact}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="form-group">
                <label className="label">Full Name *</label>
                <input 
                  type="text" className="input" 
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="label">Department</label>
                <input 
                  type="text" className="input" 
                  value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input 
                    type="email" className="input" 
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Contact Number</label>
                  <input 
                    type="text" className="input" 
                    value={form.contact} onChange={e => setForm({...form, contact: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-custom">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
