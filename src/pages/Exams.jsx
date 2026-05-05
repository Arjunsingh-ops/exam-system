import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Loader2, Calendar, Clock, BookOpen, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { examAPI } from '../services/api';

export function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    title: '',
    course_name: '',
    course_code: '',
    programs: '',
    semester: 1,
    exam_type: 'End Sem',
    exam_date: '',
    start_time: '',
    end_time: ''
  });

  const fetchExams = async () => {
    try {
      const res = await examAPI.getAll();
      setExams(res.data.exams || []);
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleOpenModal = (exam = null) => {
    if (exam) {
      setEditingId(exam.id);
      // Format date for inputs
      setForm({ ...exam, exam_date: exam.exam_date.split('T')[0] });
    } else {
      setEditingId(null);
      setForm({
        title: '', course_name: '', course_code: '', programs: '', semester: 1,
        exam_type: 'End Sem', exam_date: '', start_time: '', end_time: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const savePromise = editingId 
      ? examAPI.update(editingId, form)
      : examAPI.create(form);

    toast.promise(savePromise, {
      loading: 'Saving...',
      success: 'Exam saved successfully',
      error: (err) => err.response?.data?.message || 'Failed to save exam'
    }).then(() => {
      fetchExams();
      setIsModalOpen(false);
    });
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete exam "${title}"?`)) return;
    try {
      await examAPI.delete(id);
      toast.success('Exam deleted');
      fetchExams();
    } catch (err) {
      toast.error('Failed to delete exam');
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'End Sem': return 'badge-green';
      case 'Mid Sem': return 'badge-blue';
      case 'Back Exam': return 'badge-red';
      default: return 'badge-purple';
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title">Exam Management</h1>
          <p className="page-subtitle">Create and schedule examinations</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Create Exam
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="spin text-accent" size={32} /></div>
      ) : exams.length === 0 ? (
        <div className="empty-state border border-dashed border-custom rounded-xl">
          <FileText className="empty-state-icon mx-auto text-muted" size={48} />
          <div className="empty-state-text mb-4">No exams scheduled yet.</div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>Create First Exam</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam Details</th>
                <th>Course Info</th>
                <th>Program(s)</th>
                <th>Type</th>
                <th>Schedule</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam.id}>
                  <td>
                    <div className="font-semibold">{exam.title}</div>
                  </td>
                  <td>
                    <div className="font-medium text-sm flex items-center gap-1">
                      <BookOpen size={12} className="text-accent" /> {exam.course_name}
                    </div>
                    {exam.course_code && (
                      <div className="text-xs text-muted flex items-center gap-1 mt-1">
                        <Code2 size={10} /> {exam.course_code}
                      </div>
                    )}
                    <div className="text-xs text-muted mt-1">Semester {exam.semester}</div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {exam.programs.split(',').map((p, i) => (
                        <span key={i} className="badge badge-purple">{p.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getTypeColor(exam.exam_type)}`}>{exam.exam_type}</span>
                  </td>
                  <td>
                    <div className="text-sm flex items-center gap-1.5">
                      <Calendar size={14} className="text-muted" /> 
                      {new Date(exam.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year:'numeric' })}
                    </div>
                    <div className="text-xs text-muted flex items-center gap-1.5 mt-1">
                      <Clock size={12} />
                      {exam.start_time.slice(0,5)} to {exam.end_time.slice(0,5)}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-ghost btn-icon" onClick={() => handleOpenModal(exam)}>
                        <Edit2 size={16} className="text-muted hover:text-accent" />
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(exam.id, exam.title)}>
                        <Trash2 size={16} className="text-muted hover:text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Edit Exam' : 'Create New Exam'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="form-group">
                <label className="label">Exam Title *</label>
                <input 
                  type="text" className="input" 
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. End Semester Final Exam 2024" required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Course Name *</label>
                  <input 
                    type="text" className="input" 
                    value={form.course_name} onChange={e => setForm({...form, course_name: e.target.value})}
                    placeholder="e.g. Data Structures" required 
                  />
                  <p className="text-[10px] text-muted mt-1">The subject being examined</p>
                </div>
                <div className="form-group">
                  <label className="label">Course Code</label>
                  <input 
                    type="text" className="input" 
                    value={form.course_code} onChange={e => setForm({...form, course_code: e.target.value})}
                    placeholder="e.g. CS201" 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Target Program(s) *</label>
                  <input 
                    type="text" className="input" 
                    value={form.programs} onChange={e => setForm({...form, programs: e.target.value})}
                    placeholder="e.g. B.Tech, M.Tech" required 
                  />
                  <p className="text-[10px] text-muted mt-1">Comma-separated programs (e.g. B.Tech, M.Tech)</p>
                </div>
                <div className="form-group">
                  <label className="label">Semester *</label>
                  <input 
                    type="number" className="input" min="1" max="10"
                    value={form.semester} onChange={e => setForm({...form, semester: parseInt(e.target.value) || 1})}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Exam Type *</label>
                <select 
                  className="input" 
                  value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}
                >
                  <option value="End Sem">End Semester</option>
                  <option value="Mid Sem">Mid Semester</option>
                  <option value="Back Exam">Back Exam</option>
                </select>
              </div>

              <div className="form-group border-t border-custom pt-4 mt-2">
                <label className="label text-accent-light flex items-center gap-1.5"><Calendar size={14} /> Schedule</label>
                <div className="form-row mt-3">
                  <div>
                    <label className="label text-[11px]">Date *</label>
                    <input type="date" className="input" value={form.exam_date} onChange={e => setForm({...form, exam_date: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                      <label className="label text-[11px]">Start *</label>
                      <input type="time" className="input px-2" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
                     </div>
                     <div>
                      <label className="label text-[11px]">End *</label>
                      <input type="time" className="input px-2" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
