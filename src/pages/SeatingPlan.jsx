import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Sparkles, Download, Printer, Loader2,
  Search, LayoutGrid, List, CheckSquare, Square,
  Building2, Users, AlertTriangle, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  examAPI, roomAPI, teacherAPI, seatingAPI,
  studentAPI, downloadSeatingPDF
} from '../services/api';

// Distinct harmonious color palette for interleaving programs in the visual grid
const PROGRAM_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.22)', border: '#6366f1', text: '#a5b4fc', tagBg: '#312e81' },
  { bg: 'rgba(16, 185, 129, 0.22)', border: '#10b981', text: '#6ee7b7', tagBg: '#064e3b' },
  { bg: 'rgba(245, 158, 11, 0.22)', border: '#f59e0b', text: '#fcd34d', tagBg: '#78350f' },
  { bg: 'rgba(236, 72, 153, 0.22)', border: '#ec4899', text: '#f472b6', tagBg: '#831843' },
  { bg: 'rgba(59, 130, 246, 0.22)', border: '#3b82f6', text: '#93c5fd', tagBg: '#1e3a8a' },
  { bg: 'rgba(168, 85, 247, 0.22)', border: '#a855f7', text: '#d8b4fe', tagBg: '#581c87' },
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

  // Configuration selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);

  // Eligible students count for the selected exam
  const [eligibleStudentCount, setEligibleStudentCount] = useState(null);

  // Action loaders
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Preview state
  const [previewData, setPreviewData] = useState([]); // Array of room objects
  const [rawRecords, setRawRecords] = useState([]);   // Flat list of all seating records
  const [previewStats, setPreviewStats] = useState(null);
  const [viewingRoom, setViewingRoom] = useState(null);
  const [previewViewMode, setPreviewViewMode] = useState('grid'); // 'grid' | 'roster'
  const [rosterSearch, setRosterSearch] = useState('');

  const fetchInitialData = async () => {
    try {
      const [exRes, rmRes, tcRes] = await Promise.all([
        examAPI.getAll(),
        roomAPI.getAll(),
        teacherAPI.getAll(),
      ]);
      setExams(exRes.data.exams || []);
      setRooms(rmRes.data.rooms || []);
      setTeachers(tcRes.data.teachers || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load initial configuration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const processPreviewData = useCallback((records) => {
    setRawRecords(records);
    const rMap = {};
    records.forEach((r) => {
      if (!rMap[r.room_id]) {
        rMap[r.room_id] = {
          room_id: r.room_id,
          room_no: r.room_no,
          capacity: r.room_capacity,
          rows: r.rows_count || 5,
          cols: r.cols_count || 6,
          floor: r.floor,
          block: r.block,
          teacher: r.teacher_name,
          teacherDept: r.teacher_dept,
          seats: [],
        };
      }
      rMap[r.room_id].seats.push(r);
    });

    const roomList = Object.values(rMap);
    setPreviewData(roomList);
    setPreviewStats({
      total: records.length,
      roomsUsed: roomList.length,
    });

    if (roomList.length > 0) {
      setViewingRoom(roomList[0].room_no);
    }
  }, []);

  // When selected exam changes, load existing seating plan & calculate student cohort count
  useEffect(() => {
    if (!selectedExamId) {
      setPreviewData([]);
      setRawRecords([]);
      setPreviewStats(null);
      setEligibleStudentCount(null);
      return;
    }

    const currentExam = exams.find((e) => String(e.id) === String(selectedExamId));
    if (currentExam) {
      // Estimate eligible students count for this exam
      const fetchStudentCohort = async () => {
        try {
          const progs = currentExam.programs ? currentExam.programs.split(',').map((p) => p.trim()) : [];
          const res = await studentAPI.getAll({ semester: currentExam.semester, limit: 1000 });
          const allStudents = res.data.students || [];
          const matched = allStudents.filter((s) => progs.includes(s.program));
          setEligibleStudentCount(matched.length);
        } catch {
          setEligibleStudentCount(null);
        }
      };
      fetchStudentCohort();
    }

    const loadPlan = async () => {
      try {
        const res = await seatingAPI.getAll({ exam_id: selectedExamId });
        if (res.data.seating?.length > 0) {
          processPreviewData(res.data.seating);
        } else {
          setPreviewData([]);
          setRawRecords([]);
          setPreviewStats(null);
        }
      } catch {
        setPreviewData([]);
        setRawRecords([]);
        setPreviewStats(null);
      }
    };
    loadPlan();
  }, [selectedExamId, exams, processPreviewData]);

  const toggleRoom = (id) => {
    setSelectedRoomIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllRooms = () => {
    if (selectedRoomIds.length === rooms.length) {
      setSelectedRoomIds([]);
    } else {
      setSelectedRoomIds(rooms.map((r) => r.id));
    }
  };

  const toggleTeacher = (id) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalSelectedCapacity = rooms
    .filter((r) => selectedRoomIds.includes(r.id))
    .reduce((sum, r) => sum + (parseInt(r.capacity, 10) || 0), 0);

  const selectedExamDetails = exams.find((e) => String(e.id) === String(selectedExamId));

  const handleGenerate = async () => {
    if (!selectedExamId) {
      return toast.error('Please select an examination first');
    }
    if (selectedRoomIds.length === 0) {
      return toast.error('Please select at least one examination room');
    }

    setGenerating(true);
    const toastId = toast.loading('Calculating anti-conflict hall seating allocations...');

    try {
      const res = await seatingAPI.generate({
        exam_id: selectedExamId,
        room_ids: selectedRoomIds,
        teacher_ids: selectedTeacherIds,
      });

      processPreviewData(res.data.seating);
      toast.success(res.data.message || 'Seating plan generated successfully!', { id: toastId });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate seating plan';
      toast.error(msg, { id: toastId, duration: 5000 });
    } finally {
      setGenerating(false);
    }
  };

  const handleClearSeating = async () => {
    if (!selectedExamId) return;
    if (!window.confirm('Clear the current seating plan for this examination? This will release all seat assignments.')) {
      return;
    }

    setClearing(true);
    try {
      const res = await seatingAPI.clearExam(selectedExamId);
      toast.success(res.data.message || 'Seating plan cleared');
      setPreviewData([]);
      setRawRecords([]);
      setPreviewStats(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear seating plan');
    } finally {
      setClearing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedExamId) return;
    setDownloading(true);
    const toastId = toast.loading('Compiling official A4 PDF document...');
    try {
      await downloadSeatingPDF(selectedExamId, selectedExamDetails?.title);
      toast.success('Official PDF Downloaded successfully!', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'PDF Generation failed. You can also use the Print button.', { id: toastId, duration: 5000 });
    } finally {
      setDownloading(false);
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const activeRoomData = previewData.find((r) => r.room_no === viewingRoom);

  // Extract distinct programs for color legend
  const allPrograms = [
    ...new Set(previewData.flatMap((r) => r.seats.map((s) => s.program)).filter(Boolean)),
  ];

  const filteredRoster = rawRecords.filter((s) => {
    if (!rosterSearch) return true;
    const q = rosterSearch.toLowerCase();
    return (
      s.student_name.toLowerCase().includes(q) ||
      s.roll_no.toLowerCase().includes(q) ||
      (s.enrollment_no && s.enrollment_no.toLowerCase().includes(q)) ||
      s.room_no.toLowerCase().includes(q) ||
      s.seat_no.toLowerCase().includes(q) ||
      s.program.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* ──────────────────────────────────────────────────────────────────────────
          SCREEN UI: Interactive Planner & Live Visualizer
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="fade-in flex flex-col h-[calc(100vh-80px)] overflow-hidden no-print">
        {/* Top Header */}
        <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h1 className="page-title text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-indigo-400" />
              Intelligent Seating Planner
            </h1>
            <p className="page-subtitle text-xs text-slate-400">
              Configure room grids, interleave programs to prevent conflicts, and export printable hall rosters.
            </p>
          </div>

          {previewStats && (
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                onClick={handleTriggerPrint}
                title="Print Seating Plan directly from browser"
              >
                <Printer size={14} /> Print Plan
              </button>
              <button
                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
                onClick={handleDownloadPDF}
                disabled={downloading}
                title="Download compiled server PDF"
              >
                {downloading ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
                Download Official PDF
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="spin text-indigo-400" size={36} />
            <span className="text-xs">Loading planner workspace...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden">
            {/* ─── LEFT: Configuration Wizard ───────────────────────────── */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-3.5 overflow-y-auto pr-1.5 custom-scroll">
              {/* 1. Exam Selector */}
              <div className="card !p-4 shrink-0 border-indigo-500/20">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-white uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">1</span>
                  Select Target Exam
                </div>

                <select
                  className="input text-xs bg-surface2"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                >
                  <option value="">-- Choose Examination --</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} — {e.course_name} (Sem {e.semester})
                    </option>
                  ))}
                </select>

                {selectedExamDetails && (
                  <div className="mt-3 p-3 rounded-lg bg-[#090d17] border border-custom text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Course:</span>
                      <strong className="text-white">{selectedExamDetails.course_name}</strong>
                    </div>
                    {selectedExamDetails.course_code && (
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Code:</span>
                        <span className="text-indigo-300">{selectedExamDetails.course_code}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Schedule:</span>
                      <span className="text-amber-300">
                        {selectedExamDetails.exam_date ? new Date(selectedExamDetails.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} • {selectedExamDetails.start_time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Programs:</span>
                      <span className="badge badge-purple text-[10px]">{selectedExamDetails.programs}</span>
                    </div>

                    {eligibleStudentCount !== null && (
                      <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Eligible Cohort:</span>
                        <span className="font-bold text-emerald-400">{eligibleStudentCount} Students</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Room Multi-Selection with Capacity Calculator */}
              <div className="card !p-0 shrink-0 overflow-hidden flex flex-col" style={{ maxHeight: 290 }}>
                <div className="p-3 bg-surface2 border-b border-custom flex justify-between items-center text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">2</span>
                    <span>Assign Examination Halls</span>
                  </div>
                  <button
                    onClick={selectAllRooms}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-normal"
                  >
                    {selectedRoomIds.length === rooms.length ? <CheckSquare size={13} /> : <Square size={13} />}
                    {selectedRoomIds.length === rooms.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="p-2 overflow-y-auto space-y-1 custom-scroll flex-1">
                  {rooms.length === 0 ? (
                    <div className="text-center text-slate-400 p-4 text-xs">No rooms available. Configure rooms first.</div>
                  ) : (
                    rooms.map((room) => {
                      const isChecked = selectedRoomIds.includes(room.id);
                      return (
                        <div
                          key={room.id}
                          onClick={() => toggleRoom(room.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                            isChecked
                              ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                              : 'border-transparent text-slate-300 hover:bg-surface2'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="accent-indigo-600 pointer-events-none"
                            />
                            <div>
                              <div className="text-xs font-semibold">Room {room.room_no}</div>
                              <div className="text-[10px] text-slate-400">
                                {[room.block ? 'Block ' + room.block : '', room.floor ? room.floor : ''].filter(Boolean).join(' • ') || 'Main Campus'}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-emerald-400">{room.capacity} seats</span>
                            <div className="text-[9px] text-slate-400 font-mono">{room.rows_count}×{room.cols_count} grid</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Real-time Capacity Adequacy Tally */}
                <div className="p-3 bg-[#090d17] border-t border-custom text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Selected Capacity:</span>
                    <span className="font-bold text-white font-mono">
                      {totalSelectedCapacity} Seats ({selectedRoomIds.length} Rooms)
                    </span>
                  </div>

                  {eligibleStudentCount !== null && (
                    <div className="mt-1">
                      {totalSelectedCapacity >= eligibleStudentCount ? (
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <span>✓ Capacity is sufficient ({totalSelectedCapacity - eligibleStudentCount} spare seats)</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                          <AlertTriangle size={12} />
                          <span>Shortage of {eligibleStudentCount - totalSelectedCapacity} seats! Please select more rooms.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Invigilators (Optional) */}
              <div className="card !p-0 shrink-0 overflow-hidden flex flex-col" style={{ maxHeight: 200 }}>
                <div className="p-3 bg-surface2 border-b border-custom flex justify-between items-center text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">3</span>
                    <span>Assign Invigilators (Optional)</span>
                  </div>
                  <span className="badge badge-purple text-[10px]">{selectedTeacherIds.length} Chosen</span>
                </div>
                <div className="p-2 overflow-y-auto space-y-1 custom-scroll flex-1">
                  {teachers.map((teacher) => {
                    const isChecked = selectedTeacherIds.includes(teacher.id);
                    return (
                      <div
                        key={teacher.id}
                        onClick={() => toggleTeacher(teacher.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                          isChecked ? 'bg-indigo-600/15 border-indigo-500/40 text-white' : 'border-transparent text-slate-300 hover:bg-surface2'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="accent-indigo-600 pointer-events-none"
                          />
                          <span className="text-xs">{teacher.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{teacher.department}</span>
                      </div>
                    );
                  })}
                  {teachers.length === 0 && (
                    <div className="text-center text-slate-400 p-3 text-xs">No faculty added yet.</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25"
                  onClick={handleGenerate}
                  disabled={generating || !selectedExamId || selectedRoomIds.length === 0}
                >
                  {generating ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                  <span>{generating ? 'Calculating Allocations...' : 'Generate Seating Plan'}</span>
                </button>

                {previewStats && (
                  <button
                    className="btn btn-ghost btn-sm w-full text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                    onClick={handleClearSeating}
                    disabled={clearing}
                  >
                    <Trash2 size={13} />
                    <span>Clear Plan for this Exam</span>
                  </button>
                )}
              </div>
            </div>

            {/* ─── RIGHT: Live Preview & Inspection Panel ────────────────── */}
            <div className="flex-1 card !p-0 flex flex-col overflow-hidden border border-custom bg-[#090d17]">
              {/* Preview Bar */}
              <div className="p-3.5 bg-surface border-b border-custom flex flex-wrap justify-between items-center gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Search size={16} className="text-indigo-400" />
                    Interactive Seating Plan Preview
                  </h3>
                  {previewStats && (
                    <span className="badge badge-green text-[10px]">
                      {previewStats.total} Students Allocated Across {previewStats.roomsUsed} Hall(s)
                    </span>
                  )}
                </div>

                {previewStats && (
                  <div className="flex items-center gap-2">
                    {/* Switch between visual matrix and table roster */}
                    <div className="flex items-center bg-surface2 rounded-lg p-1 border border-custom">
                      <button
                        onClick={() => setPreviewViewMode('grid')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                          previewViewMode === 'grid'
                            ? 'bg-indigo-600 text-white font-medium shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <LayoutGrid size={13} /> Grid Matrix
                      </button>
                      <button
                        onClick={() => setPreviewViewMode('roster')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                          previewViewMode === 'roster'
                            ? 'bg-indigo-600 text-white font-medium shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <List size={13} /> Student Roster
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Content Body */}
              {previewStats ? (
                previewViewMode === 'grid' ? (
                  <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Room Selector Sidebar */}
                    <div className="w-52 border-r border-custom bg-[#0e1424] py-3 overflow-y-auto custom-scroll flex flex-col shrink-0">
                      <div className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Allocated Rooms ({previewStats.roomsUsed})
                      </div>
                      <div className="space-y-1 px-2">
                        {previewData.map((room) => {
                          const isActive = viewingRoom === room.room_no;
                          return (
                            <button
                              key={room.room_no}
                              onClick={() => setViewingRoom(room.room_no)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${
                                isActive
                                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white font-semibold'
                                  : 'border-transparent text-slate-300 hover:bg-surface2'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold">Room {room.room_no}</span>
                                <span className="badge badge-purple text-[9px] font-mono">{room.seats.length}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {[room.block ? 'Blk ' + room.block : '', room.floor ? room.floor : ''].filter(Boolean).join(', ') || 'Main'}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Color-Coded Program Legend */}
                      {allPrograms.length > 0 && (
                        <div className="mt-auto px-3.5 pt-4 border-t border-custom">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
                            Program Distribution
                          </div>
                          <div className="space-y-1.5">
                            {allPrograms.map((prog) => {
                              const color = getProgramColor(prog, allPrograms);
                              return (
                                <div key={prog} className="flex items-center gap-2 text-[11px] text-slate-300">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0 border"
                                    style={{ backgroundColor: color.border, borderColor: color.border }}
                                  />
                                  <span className="truncate">{prog}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Room Seat Matrix Visualizer */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scroll bg-[#060911]">
                      {activeRoomData && (
                        <div className="max-w-4xl mx-auto space-y-6">
                          {/* Room Header Info Card */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl bg-surface border border-custom">
                            <div>
                              <div className="flex items-center gap-2">
                                <Building2 size={18} className="text-indigo-400" />
                                <h2 className="text-lg font-bold text-white tracking-wide">
                                  EXAMINATION HALL: ROOM {activeRoomData.room_no}
                                </h2>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {[activeRoomData.block ? 'Block ' + activeRoomData.block : '', activeRoomData.floor ? activeRoomData.floor : ''].filter(Boolean).join(' • ') || 'Main Campus'}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Invigilator</div>
                                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1 justify-end">
                                  <Users size={12} />
                                  <span>{activeRoomData.teacher || 'Unassigned / Faculty on Duty'}</span>
                                </div>
                              </div>
                              <div className="pl-3 border-l border-slate-700">
                                <span className="badge badge-green font-mono text-xs">
                                  {activeRoomData.seats.length} / {activeRoomData.capacity || activeRoomData.rows * activeRoomData.cols} Filled
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Front Desk / Blackboard Banner */}
                          <div className="relative w-full h-8 bg-surface2 border border-custom rounded-lg flex items-center justify-center text-[10px] text-slate-400 uppercase tracking-[4px] font-bold shadow-inner">
                            <span>FRONT DESK / CHALKBOARD / INSTRUCTOR PODIUM</span>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-surface2"></div>
                          </div>

                          {/* Dynamic Seating Grid */}
                          <div
                            className="grid gap-2.5 mx-auto justify-center overflow-x-auto pb-4"
                            style={{
                              gridTemplateColumns: `repeat(${activeRoomData.cols}, minmax(88px, 1fr))`,
                            }}
                          >
                            {Array.from({ length: activeRoomData.rows }).map((_, rowIndex) => {
                              return Array.from({ length: activeRoomData.cols }).map((_, colIndex) => {
                                const seatId = `R${rowIndex + 1}-C${colIndex + 1}`;
                                const student = activeRoomData.seats.find((s) => s.seat_no === seatId);
                                const color = student ? getProgramColor(student.program, allPrograms) : null;

                                return (
                                  <div
                                    key={seatId}
                                    className={`min-h-[85px] rounded-lg border p-1.5 flex flex-col justify-between text-center transition-all ${
                                      student
                                        ? 'hover:scale-105 hover:shadow-lg'
                                        : 'border-dashed border-slate-800 bg-[#0c101d]/50 opacity-40'
                                    }`}
                                    style={
                                      student
                                        ? {
                                            backgroundColor: color.bg,
                                            borderColor: color.border,
                                            boxShadow: `0 0 12px ${color.bg}`,
                                          }
                                        : {}
                                    }
                                    title={
                                      student
                                        ? `${student.student_name} (${student.roll_no}) - ${student.program}`
                                        : 'Unassigned Seat'
                                    }
                                  >
                                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                                      <span>{seatId}</span>
                                      {student && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                    </div>

                                    {student ? (
                                      <>
                                        <div className="font-bold text-[11px] text-white leading-tight line-clamp-2 px-0.5">
                                          {student.student_name}
                                        </div>
                                        <div className="font-mono text-[9px] text-slate-300 truncate">
                                          {student.roll_no}
                                        </div>
                                        <div
                                          className="text-[8.5px] font-bold truncate rounded py-0.5 px-1 mt-0.5"
                                          style={{
                                            color: color.text,
                                            backgroundColor: color.tagBg,
                                          }}
                                        >
                                          {student.program}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-[10px] text-slate-600 my-auto">Vacant</div>
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
                  /* Tabular Student Roster View */
                  <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 shrink-0">
                      <div className="search-bar w-80">
                        <Search size={14} className="search-icon" />
                        <input
                          type="text"
                          className="input text-xs py-1.5"
                          placeholder="Search allocated roster..."
                          value={rosterSearch}
                          onChange={(e) => setRosterSearch(e.target.value)}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        Showing <strong className="text-white">{filteredRoster.length}</strong> student seat allocations
                      </span>
                    </div>

                    <div className="table-wrap flex-1 overflow-y-auto custom-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Hall No</th>
                            <th>Seat Tag</th>
                            <th>Student Name</th>
                            <th>Roll Number</th>
                            <th>Enrollment No</th>
                            <th>Program</th>
                            <th>Specialization</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRoster.map((item, idx) => (
                            <tr key={item.id}>
                              <td className="font-mono text-xs text-slate-400">{idx + 1}</td>
                              <td>
                                <span className="font-bold text-white">Room {item.room_no}</span>
                              </td>
                              <td>
                                <span className="badge badge-purple font-mono font-bold">{item.seat_no}</span>
                              </td>
                              <td>
                                <div className="font-semibold text-slate-100">{item.student_name}</div>
                              </td>
                              <td>
                                <span className="font-mono text-xs text-indigo-300 font-bold">{item.roll_no}</span>
                              </td>
                              <td>
                                <span className="font-mono text-xs text-slate-400">{item.enrollment_no || '—'}</span>
                              </td>
                              <td>
                                <span className="badge badge-blue">{item.program}</span>
                              </td>
                              <td>
                                <span className="text-xs text-slate-300">{item.specialization || 'General'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                  <LayoutGrid size={56} className="mb-4 opacity-20 text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-200 mb-1">No Seating Plan Generated Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                    Select an examination and configure the available examination rooms on the left panel, then click &quot;Generate Seating Plan&quot;.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          PRINT-ONLY DOCUMENT: Clean Official University Hall Roster for window.print()
          (Hidden on screen via .print-only in index.css)
          ────────────────────────────────────────────────────────────────────────── */}
      {previewData.length > 0 && selectedExamDetails && (
        <div className="hidden print:block text-slate-900 bg-white">
          {previewData.map((room, roomIdx) => (
            <div key={room.room_no} className={`room-sheet ${roomIdx > 0 ? 'print-page-break' : ''} p-4`}>
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-2 mb-3 flex justify-between items-center">
                <div>
                  <h1 className="text-base font-extrabold tracking-wider text-slate-900">APEX UNIVERSITY</h1>
                  <p className="text-[9px] font-bold tracking-widest text-slate-600 uppercase">
                    Office of the Controller of Examinations
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-bold text-[9px] uppercase tracking-wider rounded">
                    {selectedExamDetails.exam_type}
                  </span>
                </div>
              </div>

              <div className="text-center bg-slate-100 border border-slate-300 p-1.5 rounded mb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Official Examination Seating & Hall Allocation Plan
                </h2>
              </div>

              {/* Exam Info Matrix */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9.5px] border border-slate-200 p-2 rounded mb-3">
                <div><span className="font-semibold text-slate-600">Course:</span> <strong>{selectedExamDetails.course_name}</strong> {selectedExamDetails.course_code ? `(${selectedExamDetails.course_code})` : ''}</div>
                <div><span className="font-semibold text-slate-600">Semester:</span> Semester {selectedExamDetails.semester}</div>
                <div><span className="font-semibold text-slate-600">Exam Date:</span> {selectedExamDetails.exam_date ? new Date(selectedExamDetails.exam_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                <div><span className="font-semibold text-slate-600">Shift Timing:</span> {selectedExamDetails.start_time} - {selectedExamDetails.end_time}</div>
                <div className="col-span-2"><span className="font-semibold text-slate-600">Programs:</span> {selectedExamDetails.programs}</div>
              </div>

              {/* Room Bar */}
              <div className="bg-slate-900 text-white px-3 py-1.5 rounded mb-2 flex justify-between items-center text-[10px]">
                <div>
                  <strong>ROOM NO: {room.room_no}</strong>
                  <span className="text-slate-300 ml-2">({[room.block ? 'Block ' + room.block : '', room.floor ? room.floor : ''].filter(Boolean).join(', ') || 'Main Campus'})</span>
                </div>
                <div>Allocated: <strong>{room.seats.length} Students</strong></div>
              </div>

              <div className="flex justify-between items-center text-[9px] bg-slate-50 border border-slate-200 px-3 py-1 rounded mb-3">
                <div>Assigned Invigilator: <strong>{room.teacher || 'Faculty on Duty'}</strong> {room.teacherDept ? `(${room.teacherDept})` : ''}</div>
                <div>Room Sign-off: ________________________</div>
              </div>

              {/* Seating Table */}
              <table className="print-table w-full">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>S.No</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Seat No</th>
                    <th>Student Name</th>
                    <th style={{ width: '110px' }}>Roll Number</th>
                    <th style={{ width: '110px' }}>Enrollment No</th>
                    <th style={{ width: '100px' }}>Program</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Student Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {room.seats.map((seat, sIdx) => (
                    <tr key={seat.id} className={sIdx % 2 === 1 ? 'print-odd' : ''}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{sIdx + 1}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>{seat.seat_no}</td>
                      <td style={{ fontWeight: '600' }}>{seat.student_name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{seat.roll_no}</td>
                      <td style={{ fontFamily: 'monospace' }}>{seat.enrollment_no || '—'}</td>
                      <td>{seat.program}</td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center text-[8px] text-slate-500 mt-2 pt-1 border-t border-slate-200">
                <span>Apex University Examination Management System • Confidential</span>
                <span>Page {roomIdx + 1} of {previewData.length}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
