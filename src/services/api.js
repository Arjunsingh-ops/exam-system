import axios from "axios";
import { saveAs } from "file-saver";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally (redirect to login)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

// ── Students ─────────────────────────────────────────────────────────────────
export const studentAPI = {
  getMyProfile: () => api.get("/students/me"),
  upsertMyProfile: (data) => api.post("/students/me", data),
  getAll: (params) => api.get("/students", { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post("/students", data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getDepartments: () => api.get("/students/departments"),
};

// ── Rooms ─────────────────────────────────────────────────────────────────────
export const roomAPI = {
  getAll: () => api.get("/rooms"),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post("/rooms", data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

// ── Exams ─────────────────────────────────────────────────────────────────────
export const examAPI = {
  getAll: () => api.get("/exams"),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post("/exams", data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
};

// ── Seating ───────────────────────────────────────────────────────────────────
export const seatingAPI = {
  getAll: (params) => api.get("/seating", { params }),
  generate: (data) => api.post("/seating/generate", data),
  delete: (id) => api.delete(`/seating/${id}`),
  getStudentSeating: (studentId) => api.get(`/seating/student/${studentId}`),
};

// ── PDF Download ──────────────────────────────────────────────────────────────
export const downloadPDF = async ({ exam_id, date, shift }) => {
  const params = new URLSearchParams();
  if (exam_id) params.append("exam_id", exam_id);
  if (date) params.append("date", date);
  if (shift) params.append("shift", shift);

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/seating/pdf?${params}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "PDF download failed");
  }

  const blob = await response.blob();
  const filename =
    response.headers.get("content-disposition")?.match(/filename="(.+?)"/)?.[1] ||
    `Seating_Plan_${date || "all"}_${shift || "all"}.pdf`;
  saveAs(blob, filename);
};

export default api;
