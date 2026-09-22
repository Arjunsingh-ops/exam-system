import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UploadCloud, Search, Trash2, Loader2, AlertCircle,
  GraduationCap, Download, FileSpreadsheet, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';

export function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [programsList, setProgramsList] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Modals
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search,
        page,
        limit,
      };
      if (selectedProgram) params.program = selectedProgram;
      if (selectedSemester) params.semester = selectedSemester;

      const res = await studentAPI.getAll(params);
      setStudents(res.data.students || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit, selectedProgram, selectedSemester]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    // Load programs for filtering
    const loadPrograms = async () => {
      try {
        const res = await studentAPI.getPrograms();
        setProgramsList(res.data.programs || []);
      } catch {
        // quiet fallback
      }
    };
    loadPrograms();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a valid .csv file');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading and importing student registry...');

    try {
      const res = await studentAPI.uploadCSV(file);
      toast.success(res.data.message || 'CSV imported successfully', { id: toastId });

      if (res.data.errors?.length > 0) {
        toast.custom(() => (
          <div className="card-glass p-4 border border-amber-500/50 shadow-xl max-w-sm">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertCircle size={16} />
              <strong className="text-xs">Import Issues Detected ({res.data.errors.length})</strong>
            </div>
            <div className="text-[11px] text-slate-300 max-h-28 overflow-y-auto space-y-1 custom-scroll">
              {res.data.errors.slice(0, 5).map((errItem, i) => (
                <div key={i} className="truncate">• {errItem.reason || JSON.stringify(errItem)}</div>
              ))}
              {res.data.errors.length > 5 && <div className="text-slate-400 italic">...and {res.data.errors.length - 5} more records</div>}
            </div>
          </div>
        ), { duration: 6000 });
      }

      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV Upload failed', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvHeader = 'name,roll_no,enrollment_no,program,batch,specialization,year,semester,email,contact\n';
    const sampleRows = [
      'John Doe,CS-101,ENR2024001,B.Tech CSE,2024-2028,Artificial Intelligence,1,1,john.doe@apex.edu,9876543210\n',
      'Jane Smith,CS-102,ENR2024002,B.Tech CSE,2024-2028,Data Science,1,1,jane.smith@apex.edu,9876543211\n',
      'Alex Johnson,EC-101,ENR2024003,B.Tech ECE,2024-2028,VLSI Design,1,1,alex.j@apex.edu,9876543212\n',
      'Emily Davis,ME-101,ENR2024004,B.Tech ME,2024-2028,Robotics,1,1,emily.d@apex.edu,9876543213\n',
    ].join('');

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Apex_University_Students_Sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Sample student CSV template downloaded');
  };

  const handleDeleteStudent = async () => {
    if (!deleteConfirmStudent) return;
    try {
      await studentAPI.delete(deleteConfirmStudent.id);
      toast.success(`Removed ${deleteConfirmStudent.name} from registry`);
      setDeleteConfirmStudent(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await studentAPI.clearAll();
      toast.success(res.data.message || 'Cleared student registry');
      setIsClearAllModalOpen(false);
      setPage(1);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear students');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-indigo-400" />
            Students Registry
          </h1>
          <p className="page-subtitle text-xs text-slate-400">
            Import, view, and manage university student records enrolled in upcoming examinations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <button
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={handleDownloadSampleCSV}
            title="Download formatted sample CSV file"
          >
            <Download size={14} /> Sample Template
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            style={{ display: 'none' }}
          />

          <button
            className="btn btn-primary btn-sm flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="spin" /> : <UploadCloud size={14} />}
            {uploading ? 'Importing CSV...' : 'Import Students CSV'}
          </button>

          <button
            className="btn btn-danger btn-sm flex items-center gap-1.5"
            onClick={() => setIsClearAllModalOpen(true)}
            disabled={total === 0}
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card !p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="search-bar flex-1 min-w-[240px]">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input text-xs"
            placeholder="Search by student name, roll number, or enrollment number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Program filter */}
          <select
            className="input !w-auto text-xs py-2 bg-surface2"
            value={selectedProgram}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Academic Programs</option>
            {programsList.map((prog) => (
              <option key={prog} value={prog}>
                {prog}
              </option>
            ))}
          </select>

          {/* Semester filter */}
          <select
            className="input !w-auto text-xs py-2 bg-surface2"
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>

          {/* Per Page */}
          <select
            className="input !w-auto text-xs py-2 bg-surface2"
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="spin text-indigo-400" size={32} />
          <span className="text-xs">Loading student records...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state card border-dashed border-slate-700 p-12 text-center">
          <FileSpreadsheet className="empty-state-icon mx-auto text-slate-600 mb-3" size={48} />
          <h3 className="text-base font-semibold text-slate-200 mb-1">No Student Records Found</h3>
          <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
            {search || selectedProgram || selectedSemester
              ? 'No student matches the specified filter criteria. Try resetting your search.'
              : 'Upload a CSV file containing your student enrollment data to begin assigning examination seating.'}
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={14} /> Import CSV
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Enrollment No</th>
                  <th>Program</th>
                  <th>Specialization</th>
                  <th>Sem & Year</th>
                  <th>Contact / Email</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="font-semibold text-slate-100">{student.name}</div>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                        {student.roll_no}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-300">
                        {student.enrollment_no || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-purple">{student.program}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-300">{student.specialization || 'General'}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-300">Sem {student.semester} • Yr {student.year || 1}</span>
                    </td>
                    <td>
                      <div className="text-[11px] text-slate-400">{student.email || '—'}</div>
                      {student.contact && <div className="text-[10px] text-slate-400">{student.contact}</div>}
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-danger btn-sm p-1.5"
                        onClick={() => setDeleteConfirmStudent(student)}
                        title="Remove Student"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-2 py-3 bg-surface rounded-xl border border-custom">
            <div className="text-xs text-slate-400">
              Showing <strong className="text-white">{(page - 1) * limit + 1}</strong> to <strong className="text-white">{Math.min(page * limit, total)}</strong> of <strong className="text-white">{total}</strong> students
            </div>

            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm p-1.5"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium text-slate-300 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm p-1.5"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Student Modal */}
      {deleteConfirmStudent && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmStudent(null)}>
          <div className="modal-box !max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Remove Student Record?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Remove <strong className="text-white">{deleteConfirmStudent.name}</strong> (Roll No: {deleteConfirmStudent.roll_no}) from the student registry? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmStudent(null)}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteStudent}>
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Modal */}
      {isClearAllModalOpen && (
        <div className="modal-overlay" onClick={() => setIsClearAllModalOpen(false)}>
          <div className="modal-box !max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">Clear All Student Records?</h3>
            </div>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Warning: This will delete ALL <strong className="text-red-400">{total}</strong> student records from the database and invalidate any seating plans depending on them.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setIsClearAllModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleClearAll}>
                Yes, Clear All Students
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
