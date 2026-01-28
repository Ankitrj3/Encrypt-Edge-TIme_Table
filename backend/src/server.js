import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initStorage } from './services/storageService.js';

// Import routes
import studentsRoutes from './routes/students.js';
import timetableRoutes from './routes/timetable.js';
import calendarRoutes from './routes/calendar.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

// Middleware
app.use(cors({
    origin: config.frontendUrl,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/students', studentsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/auth', calendarRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Initialize storage
        await initStorage();
        console.log('[Storage] Initialized');

        app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║      LPU Timetable → Google Calendar Backend               ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${config.port}                 ║
║  Environment: ${config.nodeEnv.padEnd(42)}║
║                                                            ║
║  API Endpoints:                                            ║
║  • POST /api/students/import  - Import students            ║
║  • POST /api/timetable/fetch  - Fetch timetables           ║
║  • GET  /api/auth/google      - Google OAuth               ║
║  • POST /api/calendar/sync    - Sync to calendar           ║
║  • GET  /api/dashboard        - Dashboard data             ║
╚════════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
};

// Export app for Cloud Functions
export { app };

// Start server if run directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
    startServer();
}
