import axios from 'axios';

// In production, use the full backend URL from environment variable
// In development, use relative path (Vite proxy will handle it)
const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api';

// Export for use in components that need the raw base URL (like OAuth redirects)
export const getAuthUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}${path}`;
};

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Students API
export const studentsApi = {
    import: (students) => api.post('/students/import', students),
    getAll: () => api.get('/students'),
    delete: (regNo) => api.delete(`/students/${regNo}`)
};

// Timetable API
export const timetableApi = {
    fetch: (regNos) => api.post('/timetable/fetch', { regNos }),
    fetchOne: (regNo) => api.post('/timetable/fetch', { regNo }),
    get: (regNo) => api.get(`/timetable/${regNo}`),
    fetchAll: () => api.post('/timetable/fetch-all')
};

// Calendar API
export const calendarApi = {
    getAuthStatus: () => api.get('/auth/status'),
    sync: (regNos, selectedClasses = null) =>
        api.post('/calendar/sync', { regNos, selectedClasses }),
    syncAll: () => api.post('/calendar/sync-all'),
    deleteEvents: (regNo) => api.delete(`/calendar/events/${regNo}`)
};

// Dashboard API
export const dashboardApi = {
    get: () => api.get('/dashboard'),
    filter: (filters) => api.get('/dashboard/filter', { params: filters }),
    schedule: (day = null) => api.get('/dashboard/schedule', { params: { day } })
};

export default api;
