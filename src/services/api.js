import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  me:             ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
};

export const studentAPI = {
  getAll:      (params) => api.get('/students', { params }),
  getPrograms: ()       => api.get('/students/programs'),
  create:      (data)   => api.post('/students', data),
  update:      (id, d)  => api.put(`/students/${id}`, d),
  delete:      (id)     => api.delete(`/students/${id}`),
  clearAll:    ()       => api.delete('/students/clear'),
  uploadCSV:   (file)   => {
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

export const downloadSeatingPDF = async (exam_id, examTitle = '') => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE}/seating/pdf?exam_id=${exam_id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate seating plan PDF';
    try {
      const errJson = await response.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const cd = response.headers.get('content-disposition') || '';
  const match = cd.match(/filename="?([^";]+)"?/i);
  const cleanTitle = (examTitle || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = match ? match[1] : `Exam-Seating-Plan-${cleanTitle}.pdf`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;

