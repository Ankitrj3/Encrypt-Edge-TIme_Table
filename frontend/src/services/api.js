import axios from 'axios';

const API_BASE = '/api';

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
