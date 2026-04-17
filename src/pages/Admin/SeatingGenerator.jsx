import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DownloadCloud, Loader2, Sparkles, CheckSquare, Square } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Label } from "../../components/ui/Input";
import api, { examAPI, roomAPI, seatingAPI, downloadPDF } from "../../services/api";

export function SeatingGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [seatingData, setSeatingData] = useState([]);
  
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);

  useEffect(() => {
    fetchExamsAndRooms();
  }, []);

  const fetchExamsAndRooms = async () => {
    try {
      const [examRes, roomRes] = await Promise.all([examAPI.getAll(), roomAPI.getAll()]);
      setExams(examRes.data.exams || []);
      setRooms(roomRes.data.rooms || []);
    } catch (err) {
      toast.error("Failed to fetch initial data");
    }
  };

  const toggleRoom = (id) => {
    setSelectedRooms((prev) => 
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!selectedExam) return toast.error("Please select an exam");
    if (selectedRooms.length === 0) return toast.error("Please select at least one room");

    setIsGenerating(true);
    try {
      const res = await seatingAPI.generate({ exam_id: selectedExam, room_ids: selectedRooms });
      setSeatingData(res.data.seating || []);
      toast.success("Seating plan generated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedExam) return toast.error("No exam selected");
    setIsDownloading(true);
    const toastId = toast.loading("Generating PDF...");
    try {
      await downloadPDF({ exam_id: selectedExam });
      toast.success("PDF downloaded successfully!", { id: toastId });
    } catch (err) {
      const msg = err.message || "Failed to download PDF.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Seating Generator</h1>
          <p className="text-slate-500 dark:text-slate-400">Dynamically distribute students into available rooms.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Config area */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Select exam and rooms to allocate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Select Exam</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-indigo-500"
                value={selectedExam} 
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                <option value="">-- Choose an Exam --</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.title} ({ex.shift})</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label>Select Rooms</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 p-2 border border-slate-200 dark:border-slate-800 rounded-md">
                {rooms.length === 0 && <p className="text-sm text-slate-500">No rooms available</p>}
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center space-x-2" onClick={() => toggleRoom(room.id)}>
                    {selectedRooms.includes(room.id) ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 cursor-pointer" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 cursor-pointer" />
                    )}
                    <span className="text-sm cursor-pointer select-none">
                      {room.room_no} (Cap: {room.capacity})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Plan
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleDownloadPDF} 
              disabled={seatingData.length === 0 || isDownloading}
            >
              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-2" />}
              Download PDF
            </Button>
          </CardFooter>
        </Card>

        {/* Right Column: Preview area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {seatingData.length === 0 
                ? "No seating plan generated yet." 
                : `Displaying ${seatingData.length} assigned seats.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {seatingData.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Seat</TableHead>
                      <TableHead>Shift</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seatingData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.student_name}</TableCell>
                        <TableCell>{row.roll_no}</TableCell>
                        <TableCell>{row.room_no}</TableCell>
                        <TableCell>{row.seat_no}</TableCell>
                        <TableCell>{row.shift}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">Click generate to view seating plan preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
