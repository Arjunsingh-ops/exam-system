import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, FileText, Loader2, Calendar, Clock,
  BookOpen, Code2, Search, ArrowRight, AlertTriangle, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { examAPI } from '../services/api';

export function Exams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState(null);

  const [form, setForm] = useState({
    title: '',
    course_name: '',
    course_code: '',
    programs: '',
    semester: 1,
    exam_type: 'End Sem',
    exam_date: '',
    start_time: '10:00:00',
    end_time: '13:00:00',
  });

  const fetchExams = async () => {
    try {
      const res = await examAPI.getAll();
      setExams(res.data.exams || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load exams');
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
      setForm({
        title: exam.title || '',
        course_name: exam.course_name || '',
        course_code: exam.course_code || '',
        programs: exam.programs || '',
        semester: exam.semester || 1,
        exam_type: exam.exam_type || 'End Sem',
        exam_date: exam.exam_date ? exam.exam_date.split('T')[0] : '',
        start_time: exam.start_time || '10:00:00',
        end_time: exam.end_time || '13:00:00',
      });
    } else {
      setEditingId(null);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      const defaultDateStr = defaultDate.toISOString().split('T')[0];

      setForm({
        title: '',
        course_name: '',
        course_code: '',
        programs: 'B.Tech CSE, B.Tech ECE',
        semester: 1,
        exam_type: 'End Sem',
        exam_date: defaultDateStr,
        start_time: '09:30:00',
        end_time: '12:30:00',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.course_name || !form.programs || !form.exam_date) {
      return toast.error('Please fill all required examination fields');
    }

    const savePromise = editingId
      ? examAPI.update(editingId, form)
      : examAPI.create(form);

    toast.promise(savePromise, {
      loading: 'Saving exam details...',
      success: editingId ? 'Exam updated successfully' : 'Exam created successfully',
      error: (err) => err.response?.data?.message || 'Failed to save exam',
    }).then(() => {
      fetchExams();
      setIsModalOpen(false);
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmExam) return;
    try {
      await examAPI.delete(deleteConfirmExam.id);
      toast.success(`Exam "${deleteConfirmExam.title}" deleted successfully`);
      setDeleteConfirmExam(null);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  const filteredExams = exams.filter((exam) => {
    const q = search.toLowerCase();
    const matchesQuery =
      exam.title.toLowerCase().includes(q) ||
      exam.course_name.toLowerCase().includes(q) ||
      (exam.course_code && exam.course_code.toLowerCase().includes(q)) ||
      exam.programs.toLowerCase().includes(q);

    const matchesType = !selectedType || exam.exam_type === selectedType;
    const matchesSemester = !selectedSemester || String(exam.semester) === String(selectedSemester);

    return matchesQuery && matchesType && matchesSemester;
  });

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-indigo-400" />
            Examination Schedule
          </h1>
          <p className="page-subtitle text-xs text-slate-400">
            Define examinations, affiliated degree programs, semesters, and shift time intervals.
          </p>
        </div>

        <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus size={16} /> Schedule Examination
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card !p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="search-bar flex-1 min-w-[240px]">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input text-xs"
            placeholder="Search by exam title, course name, code, or program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="input !w-auto text-xs py-2 bg-surface2"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Exam Types</option>
            <option value="End Sem">End Semester</option>
            <option value="Mid Sem">Mid Semester</option>
            <option value="Back Exam">Backlog / Supplementary</option>
          </select>

          <select
            className="input !w-auto text-xs py-2 bg-surface2"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>

          <div className="text-xs text-slate-400 whitespace-nowrap pl-2">
            Total: <strong className="text-white">{filteredExams.length}</strong> Exam(s)
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="spin text-indigo-400" size={32} />
          <span className="text-xs">Loading examination schedule...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="empty-state card border-dashed border-slate-700 p-12 text-center">
          <Calendar className="empty-state-icon mx-auto text-slate-600 mb-3" size={48} />
          <h3 className="text-base font-semibold text-slate-200 mb-1">No Examinations Found</h3>
          <p className="text-xs text-slate-400 mb-4">
            {search || selectedType || selectedSemester
              ? 'No exams match your search criteria.'
              : 'Create your first scheduled examination to generate seating plans.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
            <Plus size={14} /> Schedule First Exam
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam Title & Type</th>
                <th>Course & Code</th>
                <th>Academic Programs</th>
                <th>Date & Shift Timing</th>
                <th className="text-right">Seating Action</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.map((exam) => {
                const dateDisplay = exam.exam_date
                  ? new Date(exam.exam_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—';

                return (
                  <tr key={exam.id}>
                    <td>
                      <div className="font-bold text-white text-sm">{exam.title}</div>
                      <div className="mt-1">
                        <span
                          className={`badge ${
                            exam.exam_type === 'End Sem'
                              ? 'badge-green'
                              : exam.exam_type === 'Mid Sem'
                              ? 'badge-blue'
                              : 'badge-yellow'
                          }`}
                        >
                          {exam.exam_type}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-200 flex items-center gap-1.5">
                        <BookOpen size={13} className="text-indigo-400" />
                        {exam.course_name}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {exam.course_code && (
                          <span className="flex items-center gap-1 font-mono text-indigo-300">
                            <Code2 size={11} /> {exam.course_code}
                          </span>
                        )}
                        <span>• Sem {exam.semester}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {exam.programs.split(',').map((p, idx) => (
                          <span key={idx} className="badge badge-purple text-[10px]">
                            {p.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                        <Calendar size={13} className="text-amber-400" />
                        {dateDisplay}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <Clock size={11} />
                        {exam.start_time} - {exam.end_time}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 ml-auto"
                        onClick={() => navigate('/admin/seating')}
                        title="Open seating generator"
                      >
                        <span>Allocate Hall</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="btn btn-ghost btn-sm p-1.5"
                          onClick={() => handleOpenModal(exam)}
                          title="Edit Exam"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm p-1.5"
                          onClick={() => setDeleteConfirmExam(exam)}
                          title="Delete Exam"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add / Edit Exam */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box !max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-custom">
              <h2 className="modal-title flex items-center gap-2">
                <FileText className="text-indigo-400" size={20} />
                {editingId ? 'Edit Examination Record' : 'Schedule New Examination'}
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
                <label className="label">Examination Title / Session Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. End Semester Theory Examination May 2025"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Course Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Operating Systems & Cloud Computing"
                    value={form.course_name}
                    onChange={(e) => setForm((p) => ({ ...p, course_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Course Code</label>
                  <input
                    type="text"
                    className="input font-mono"
                    placeholder="e.g. CS-402, IT-301"
                    value={form.course_code}
                    onChange={(e) => setForm((p) => ({ ...p, course_code: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Applicable Academic Programs (comma-separated) *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. B.Tech CSE, B.Tech ECE"
                    value={form.programs}
                    onChange={(e) => setForm((p) => ({ ...p, programs: e.target.value }))}
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Students matching ANY of these programs will be seated together using column alternation.
                  </span>
                </div>
                <div className="form-group">
                  <label className="label">Semester *</label>
                  <select
                    className="input bg-surface2"
                    value={form.semester}
                    onChange={(e) => setForm((p) => ({ ...p, semester: parseInt(e.target.value, 10) }))}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Examination Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.exam_date}
                    onChange={(e) => setForm((p) => ({ ...p, exam_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Examination Category *</label>
                  <select
                    className="input bg-surface2"
                    value={form.exam_type}
                    onChange={(e) => setForm((p) => ({ ...p, exam_type: e.target.value }))}
                    required
                  >
                    <option value="End Sem">End Semester Examination</option>
                    <option value="Mid Sem">Mid Semester Examination</option>
                    <option value="Back Exam">Backlog / Supplementary</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Start Time *</label>
                  <input
                    type="time"
                    step="1"
                    className="input"
                    value={form.start_time}
                    onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">End Time *</label>
                  <input
                    type="time"
                    step="1"
                    className="input"
                    value={form.end_time}
                    onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-custom">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingId ? 'Save Changes' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmExam && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmExam(null)}>
          <div className="modal-box !max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Delete Scheduled Exam?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">&quot;{deleteConfirmExam.title}&quot;</strong>? Any existing seating plans generated for this exam will also be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmExam(null)}>
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
