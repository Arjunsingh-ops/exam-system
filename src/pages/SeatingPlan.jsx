import { useState, useEffect } from 'react';
import { Settings, Sparkles, DownloadCloud, Loader2, Search, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { examAPI, roomAPI, teacherAPI, seatingAPI, downloadSeatingPDF } from '../services/api';

// Color palette for different programs in the seat grid
const PROGRAM_COLORS = [
  { bg: 'rgba(108,99,255,0.15)', border: '#6c63ff', text: '#8b84ff', label: '#ede9fe' },
  { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#34d399', label: '#d1fae5' },
  { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fbbf24', label: '#fef3c7' },
  { bg: 'rgba(236,72,153,0.15)', border: '#ec4899', text: '#f472b6', label: '#fce7f3' },
  { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#60a5fa', label: '#dbeafe' },
  { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', text: '#c084fc', label: '#f3e8ff' },
];

function getProgramColor(program, programList) {
  const idx = programList.indexOf(program);
  return PROGRAM_COLORS[idx >= 0 ? idx % PROGRAM_COLORS.length : 0];
}

export function SeatingPlan() {
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Preview data
  const [previewData, setPreviewData] = useState([]);
  const [previewStats, setPreviewStats] = useState(null);
  const [viewingRoom, setViewingRoom] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [exRes, rmRes, tcRes] = await Promise.all([
        examAPI.getAll(), roomAPI.getAll(), teacherAPI.getAll()
      ]);
      setExams(exRes.data.exams || []);
      setRooms(rmRes.data.rooms || []);
      setTeachers(tcRes.data.teachers || []);
    } catch (err) {
      toast.error('Failed to load required data');
    } finally {
      setLoading(false);
    }
  };

  // When exam is selected, try to load existing seating plan
  useEffect(() => {
    if (!selectedExamId) {
      setPreviewData([]);
      setPreviewStats(null);
      return;
    }
    const loadPreview = async () => {
      try {
        const res = await seatingAPI.getAll({ exam_id: selectedExamId });
        if (res.data.seating?.length > 0) processPreviewData(res.data.seating);
        else { setPreviewData([]); setPreviewStats(null); }
      } catch (e) {
        setPreviewData([]); setPreviewStats(null);
      }
    };
    loadPreview();
  }, [selectedExamId]);

  const processPreviewData = (records) => {
    const rMap = {};
    records.forEach(r => {
      if (!rMap[r.room_id]) rMap[r.room_id] = { 
        room_no: r.room_no, rows: r.rows_count, cols: r.cols_count, 
        teacher: r.teacher_name, seats: [] 
      };
      rMap[r.room_id].seats.push(r);
    });
    setPreviewData(Object.values(rMap));
    setPreviewStats({ total: records.length, roomsUsed: Object.keys(rMap).length });
    if(Object.values(rMap).length > 0) setViewingRoom(Object.values(rMap)[0].room_no);
  };

  const toggleArrayItem = (setter, array, id) => {
    setter(array.includes(id) ? array.filter(x => x !== id) : [...array, id]);
  };

  const handleGenerate = async () => {
    if (!selectedExamId) return toast.error('Please select an exam');
    if (selectedRoomIds.length === 0) return toast.error('Please select at least one room');

    setGenerating(true);
    const toastId = toast.loading('Calculating intelligent seating arrangement...');

    try {
      const res = await seatingAPI.generate({
        exam_id: selectedExamId,
        room_ids: selectedRoomIds,
        teacher_ids: selectedTeacherIds
      });
      processPreviewData(res.data.seating);
      toast.success(res.data.message, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedExamId) return;
    setDownloading(true);
    const toastId = toast.loading('Generating professional PDF...');
    try {
      await downloadSeatingPDF(selectedExamId);
      toast.success('PDF Downloaded!', { id: toastId });
    } catch(e) {
      toast.error('PDF Generation failed', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const selectedExamDetails = exams.find(e => e.id === parseInt(selectedExamId));
  const activeRoomData = previewData.find(r => r.room_no === viewingRoom);

  // Extract all unique programs from seating data for color assignment
  const allPrograms = [...new Set(
    previewData.flatMap(r => r.seats.map(s => s.program)).filter(Boolean)
  )];

  return (
    <div className="fade-in flex flex-col h-[calc(100vh-64px)] overflow-hidden pb-4">
      <div className="page-header shrink-0 flex justify-between items-end mb-4">
        <div>
          <h1 className="page-title">Dynamic Seating Generation</h1>
          <p className="page-subtitle">Configure, generate and export seating plans</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center"><Loader2 className="spin text-accent" size={32} /></div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* LEFT: Configuration Panel */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 custom-scroll">
            
            <div className="card !p-5 shrink-0">
              <div className="flex items-center gap-2 mb-4 font-semibold text-text">
                <Settings size={16} className="text-accent" /> 1. Select Target Exam
              </div>
              <select className="input" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                <option value="">-- Choose Exam --</option>
                {exams.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.title} — {e.course_name}{e.course_code ? ` (${e.course_code})` : ''} — {e.programs} Sem {e.semester}
                  </option>
                ))}
              </select>
              {selectedExamDetails && (
                <div className="mt-3 p-3 rounded-lg bg-surface2 border border-custom text-xs space-y-1">
                  <div><span className="text-muted">Course:</span> <strong>{selectedExamDetails.course_name}</strong> {selectedExamDetails.course_code && <span className="text-muted">({selectedExamDetails.course_code})</span>}</div>
                  <div><span className="text-muted">Programs:</span> <strong>{selectedExamDetails.programs}</strong></div>
                  <div><span className="text-muted">Semester:</span> <strong>{selectedExamDetails.semester}</strong></div>
                </div>
              )}
            </div>

            <div className="card !p-0 shrink-0 overflow-hidden flex flex-col" style={{ maxHeight: 300 }}>
              <div className="p-4 border-b border-custom bg-surface2 font-semibold text-text flex justify-between items-center">
                <span>2. Assign Rooms</span>
                <span className="text-xs badge badge-purple">{selectedRoomIds.length} Selected</span>
              </div>
              <div className="p-2 overflow-y-auto">
                {rooms.map(room => (
                  <label key={room.id} className="checkbox-item">
                    <input type="checkbox" checked={selectedRoomIds.includes(room.id)} onChange={() => toggleArrayItem(setSelectedRoomIds, selectedRoomIds, room.id)} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{room.room_no}</div>
                      <div className="text-[10px] text-muted">Cap: {room.capacity} | Grid: {room.rows_count}×{room.cols_count}</div>
                    </div>
                  </label>
                ))}
                {rooms.length === 0 && <div className="text-center text-muted p-4 text-sm">No rooms available</div>}
              </div>
            </div>

            <div className="card !p-0 shrink-0 overflow-hidden flex flex-col" style={{ maxHeight: 250 }}>
              <div className="p-4 border-b border-custom bg-surface2 font-semibold text-text flex justify-between items-center">
                <span>3. Assign Invigilators (Optional)</span>
                <span className="text-xs badge badge-blue">{selectedTeacherIds.length} Selected</span>
              </div>
              <div className="p-2 overflow-y-auto">
                {teachers.map(teacher => (
                  <label key={teacher.id} className="checkbox-item">
                    <input type="checkbox" checked={selectedTeacherIds.includes(teacher.id)} onChange={() => toggleArrayItem(setSelectedTeacherIds, selectedTeacherIds, teacher.id)} />
                    <span className="text-sm">{teacher.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary btn-lg w-full shrink-0 shadow-lg" 
              onClick={handleGenerate} 
              disabled={generating || !selectedExamId || selectedRoomIds.length === 0}
            >
              {generating ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
              Generate Intelligent Plan
            </button>
          </div>

          {/* RIGHT: Live Preview Panel */}
          <div className="flex-1 card !p-0 flex flex-col overflow-hidden border border-custom bg-[#151421]">
            <div className="p-4 bg-surface border-b border-custom flex justify-between items-center shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <Search size={16} className="text-accent" /> Live Interactive Preview
              </h3>
              {previewStats && (
                <button 
                  className="btn btn-outline border-accent text-accent hover:bg-accent hover:text-white btn-sm"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? <Loader2 size={14} className="spin" /> : <DownloadCloud size={14} />}
                  Export PDF Document
                </button>
              )}
            </div>

            {previewStats ? (
              <div className="flex flex-1 overflow-hidden">
                {/* Room Tabs */}
                <div className="w-48 border-r border-custom bg-surface py-2 overflow-y-auto">
                  <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted font-bold mb-2">Rooms ({previewStats.roomsUsed})</div>
                  {previewData.map(r => (
                    <button
                      key={r.room_no}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-l-2
                        ${viewingRoom === r.room_no 
                          ? 'bg-[rgba(108,99,255,0.1)] border-accent text-accent font-semibold' 
                          : 'border-transparent text-text hover:bg-surface2'}`}
                      onClick={() => setViewingRoom(r.room_no)}
                    >
                      Room {r.room_no}
                      <div className="text-[10px] opacity-70 font-normal">{r.seats.length} Students</div>
                    </button>
                  ))}

                  {/* Program Legend */}
                  {allPrograms.length > 1 && (
                    <div className="mt-4 px-4 pt-4 border-t border-custom">
                      <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-2">Program Legend</div>
                      {allPrograms.map(p => {
                        const color = getProgramColor(p, allPrograms);
                        return (
                          <div key={p} className="flex items-center gap-2 mb-1.5">
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: color.border, flexShrink: 0 }} />
                            <span className="text-[11px] text-text truncate">{p}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Grid Visualizer */}
                <div className="flex-1 p-6 overflow-y-auto bg-[#0a0a0f]">
                  {activeRoomData && (
                    <div className="max-w-4xl mx-auto fade-in">
                      
                      {/* Room Header Info */}
                      <div className="flex justify-between items-start mb-8 bg-surface p-4 border border-custom rounded-xl">
                        <div>
                          <h2 className="text-xl font-bold text-white tracking-wide">ROOM {activeRoomData.room_no}</h2>
                          <p className="text-muted text-xs mt-1">Invigilator: <span className="text-accent-light px-1">{activeRoomData.teacher || 'Unassigned'}</span></p>
                        </div>
                        <div className="text-right">
                          <div className="badge badge-purple mb-1">Visual Grid Status</div>
                          <div className="text-[10px] text-muted">{activeRoomData.seats.length} / {activeRoomData.rows * activeRoomData.cols} Occupied</div>
                        </div>
                      </div>

                      {/* Whiteboard / Teacher Desk indicator */}
                      <div className="w-full h-8 bg-surface2 border border-custom rounded-md mb-12 flex items-center justify-center text-xs text-muted tracking-[4px] uppercase shadow-inner relative">
                        Front Desk / Chalkboard
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-surface2"></div>
                      </div>

                      {/* Actual Seat Grid */}
                      <div 
                        className="grid gap-3 mx-auto justify-center" 
                        style={{ gridTemplateColumns: `repeat(${activeRoomData.cols}, minmax(0, max-content))` }}
                      >
                        {Array.from({ length: activeRoomData.rows }).map((_, rowIndex) => {
                          return Array.from({ length: activeRoomData.cols }).map((_, colIndex) => {
                            const seatId = `R${rowIndex + 1}-C${colIndex + 1}`;
                            const student = activeRoomData.seats.find(s => s.seat_no === seatId);
                            const programColor = student ? getProgramColor(student.program, allPrograms) : null;

                            return (
                              <div 
                                key={seatId} 
                                className={`w-[90px] h-[95px] rounded-lg border flex flex-col items-center justify-center p-1 text-center transition-all ${
                                  student 
                                    ? 'hover:-translate-y-1' 
                                    : 'bg-transparent border-dashed border-[#2e2a45] opacity-40'
                                }`}
                                style={student ? {
                                  background: programColor.bg,
                                  borderColor: programColor.border,
                                  boxShadow: `0 0 15px ${programColor.bg}`,
                                } : {}}
                                title={student ? `${student.student_name} (${student.program} — ${student.specialization || 'Gen'})` : 'Empty Seat'}
                              >
                                <span className="text-[9px] font-mono text-muted mb-auto mt-1 tracking-widest">{seatId}</span>
                                {student ? (
                                  <>
                                    <div className="font-bold text-[11px] leading-tight text-white line-clamp-2 w-full px-1">{student.student_name.split(' ')[0]}</div>
                                    <div 
                                      className="text-[9px] mt-auto mb-1 px-1 rounded w-full truncate font-semibold"
                                      style={{ color: programColor.text, background: `${programColor.text}22` }}
                                    >
                                      {student.program}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-[10px] text-muted mt-auto mb-3">Empty</div>
                                )}
                              </div>
                            );
                          });
                        })}
                      </div>

                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted p-8 text-center">
                <LayoutGrid size={64} className="mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-text mb-2">No Plan Generated</h3>
                <p className="text-sm max-w-sm">Select an exam and rooms from the panel on the left, then click Generate to see the intelligent visualization grid here.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
