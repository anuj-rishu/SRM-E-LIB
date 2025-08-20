import axios from 'axios';

const API_BASE_URL = 'http://localhost:9000/api';

// Create a shared axios instance that always sends cookies
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANT: send session cookie
});

export const authAPI = {
  login: async (credentials) => {
    // Ensure cookies captured
    const response = await api.post('/login', credentials, { withCredentials: true });
    return response.data;
  },

  logout: async (csrfToken) => {
    const response = await api.delete('/logout', {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true,
    });
    return response.data;
  },

  getUserDetails: async (csrfToken) => {
    const response = await api.get('/user', {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true,
      // Force fresh data
      params: { _t: new Date().getTime() },
    });
    return response.data;
  },
};

export const fileAPI = {
  uploadFile: async (fileData, csrfToken, regNumber) => {
    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('semester', fileData.semester);
    formData.append('subjectCode', fileData.subjectCode);
    formData.append('subjectName', fileData.subjectName);
    formData.append('regulation', fileData.regulation);
    formData.append('regNumber', regNumber);

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    return response.data;
  },

  getFiles: async (csrfToken) => {
    const response = await api.get('/files', {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true,
    });
    return response.data;
  },

  getUserPoints: async (regNumber, csrfToken) => {
    const response = await api.get(`/points/${regNumber}`, {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true,
    });
    return response.data;
  },

  downloadFile: async (fileId, regNumber, csrfToken) => {
    const response = await axios.get(`${API_BASE_URL}/download/${fileId}`, {
      headers: { 'X-CSRF-Token': csrfToken },
      responseType: 'blob',
      withCredentials: true,
      params: { regNumber },
    });
    return response.data;
  },
  
  // New methods for PDF preview
  previewFile: async (fileId, regNumber, csrfToken) => {
    const response = await axios.get(`${API_BASE_URL}/preview/${fileId}`, {
      headers: { 'X-CSRF-Token': csrfToken },
      responseType: 'blob',
      withCredentials: true,
      params: { regNumber },
    });
    return response.data;
  },
  
    toggleFavorite: async (fileId, regNumber, csrfToken) => {
    const response = await api.post(`/favorites/${fileId}`, {}, {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true,
      params: { regNumber },
    });
    return response.data;
  },
  
  getFavorites: async (regNumber, csrfToken) => {
    const response = await api.get('/favorites', {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true,
      params: { regNumber },
    });
    return response.data;
  },
  
  // Popular files
  getPopularFiles: async (csrfToken) => {
    const response = await api.get('/files/popular', {
      headers: { 'X-CSRF-Token': csrfToken },
      withCredentials: true,
    });
    return response.data;
  },
};