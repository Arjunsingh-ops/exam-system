import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Search, Trash2, Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';

export function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  
  const fileInputRef = useRef(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll({ search, limit: 100 });
      setStudents(res.data.students || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading and processing CSV...');

    try {
      const res = await studentAPI.uploadCSV(file);
      toast.success(res.data.message, { id: toastId });
      
      if (res.data.errors?.length > 0) {
        toast.custom((t) => (
          <div className="card-glass p-4" style={{ border: '1px solid var(--warning)' }}>
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertCircle size={16} />
              <strong>Found {res.data.errors.length} issues in CSV</strong>
            </div>
            <div className="text-xs text-muted max-h-24 overflow-y-auto">
              {res.data.errors.slice(0, 5).map((e, i) => (
                <div key={i} className="mb-1 truncate">• {e.reason}</div>
              ))}
              {res.data.errors.length > 5 && <div>...and more</div>}
            </div>
          </div>
        ), { duration: 5000 });
      }
      
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL students? This cannot be undone.')) return;
    
    try {
      const res = await studentAPI.clearAll();
      toast.success(res.data.message);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to clear students');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title">Students Registry</h1>
          <p className="page-subtitle">Manage student data via CSV upload</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="btn btn-danger btn-sm" 
            onClick={handleClearAll}
            disabled={students.length === 0}
          >
            <Trash2 size={14} /> Clear All
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={14} className="spin" /> : <UploadCloud size={14} />}
            Upload CSV
          </button>
        </div>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex gap-4 items-center">
          <div className="search-bar flex-1">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              className="input" 
              placeholder="Search by name, roll no, or enrollment no..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted whitespace-nowrap">
            Showing <strong className="text-text">{students.length}</strong> of <strong className="text-text">{total}</strong>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="spin text-accent" size={32} /></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <GraduationCap className="empty-state-icon mx-auto" />
            <div className="empty-state-text mb-4">No students found. Upload a CSV to get started.</div>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
              Choose CSV File
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Enrollment</th>
                <th>Program</th>
                <th>Batch</th>
                <th>Specialization</th>
                <th>Year</th>
                <th>Sem</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td><span className="badge badge-purple">{s.roll_no}</span></td>
                  <td className="text-muted text-xs">{s.enrollment_no}</td>
                  <td><span className="badge badge-green">{s.program}</span></td>
                  <td className="text-muted text-xs">{s.batch || '-'}</td>
                  <td>{s.specialization || '-'}</td>
                  <td><span className="badge badge-gray">{s.year || '-'}</span></td>
                  <td><span className="badge badge-blue">S{s.semester}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* CSV Format Helper */}
      <div className="mt-8 p-4 rounded-lg bg-surface2 border border-custom text-sm">
        <h4 className="font-semibold mb-2">Required CSV Format:</h4>
        <p className="text-muted mb-2 text-xs">Your CSV file must contain a header row. Column names are flexible (e.g., 'roll_no' or 'Roll Number'). The "program" column accepts 'course' as an alias for backward compatibility.</p>
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-green">name*</span>
          <span className="badge badge-green">roll_no*</span>
          <span className="badge badge-green">enrollment_no*</span>
          <span className="badge badge-green">program*</span>
          <span className="badge badge-gray">batch</span>
          <span className="badge badge-gray">specialization</span>
          <span className="badge badge-gray">year</span>
          <span className="badge badge-gray">semester</span>
          <span className="badge badge-gray">email</span>
          <span className="badge badge-gray">contact</span>
        </div>
      </div>
    </div>
  );
}
