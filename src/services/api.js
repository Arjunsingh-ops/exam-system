import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me:    ()     => api.get('/auth/me'),
};

export const studentAPI = {
  getAll:    (params) => api.get('/students', { params }),
  getCourses:()       => api.get('/students/courses'),
  create:    (data)   => api.post('/students', data),
  update:    (id, d)  => api.put(`/students/${id}`, d),
  delete:    (id)     => api.delete(`/students/${id}`),
  clearAll:  ()       => api.delete('/students/clear'),
  uploadCSV: (file)   => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/students/upload-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const roomAPI = {
  getAll:  ()       => api.get('/rooms'),
  create:  (data)   => api.post('/rooms', data),
  update:  (id, d)  => api.put(`/rooms/${id}`, d),
  delete:  (id)     => api.delete(`/rooms/${id}`),
};

export const examAPI = {
  getAll:  ()       => api.get('/exams'),
  create:  (data)   => api.post('/exams', data),
  update:  (id, d)  => api.put(`/exams/${id}`, d),
  delete:  (id)     => api.delete(`/exams/${id}`),
};

export const teacherAPI = {
  getAll:  ()       => api.get('/teachers'),
  create:  (data)   => api.post('/teachers', data),
  update:  (id, d)  => api.put(`/teachers/${id}`, d),
  delete:  (id)     => api.delete(`/teachers/${id}`),
};

export const seatingAPI = {
  getAll:    (params) => api.get('/seating', { params }),
  generate:  (data)   => api.post('/seating/generate', data),
  clearExam: (eid)    => api.delete(`/seating/exam/${eid}`),
};

export const downloadSeatingPDF = async (exam_id) => {
  const response = await fetch(`${BASE}/seating/pdf?exam_id=${exam_id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'PDF download failed');
  }
  const blob = await response.blob();
  const cd = response.headers.get('content-disposition') || '';
  const filename = cd.match(/filename="(.+?)"/)?.[1] || `SeatingPlan_Exam${exam_id}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default api;
