import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDashboardStats, getAllStudents } from '../services/storageService.js';
import { isAuthenticated } from '../services/calendarService.js';

const router = Router();

/**
 * GET /api/dashboard
 * Get dashboard data with stats and student list
 */
router.get('/', asyncHandler(async (req, res) => {
    const dashboardData = getDashboardStats();

    res.json({
        success: true,
        authenticated: isAuthenticated(),
        ...dashboardData
    });
}));

/**
 * GET /api/dashboard/filter
 * Get filtered student data
 * Query params: day, room, student, status
 */
router.get('/filter', asyncHandler(async (req, res) => {
    const { day, room, student, status } = req.query;

    let students = getAllStudents();

    // Filter by student name or regNo
    if (student) {
        const searchTerm = student.toLowerCase();
        students = students.filter(s =>
            s.name.toLowerCase().includes(searchTerm) ||
            s.regNo.includes(searchTerm)
        );
    }

    // Filter by sync status
    if (status) {
        students = students.filter(s => s.syncStatus === status);
    }

    // Build response with class details
    const result = students.map(s => {
        let classes = s.timetable?.classes || [];

        // Filter by day
        if (day) {
            classes = classes.filter(c =>
                c.day.toLowerCase() === day.toLowerCase()
            );
        }

        // Filter by room
        if (room) {
            classes = classes.filter(c =>
                c.room.includes(room)
            );
        }

        return {
            regNo: s.regNo,
            name: s.name,
            phone: s.phone,
            section: s.timetable?.section || '',
            totalClasses: s.timetable?.classes?.length || 0,
            filteredClasses: classes.length,
            classes: classes,
            rooms: [...new Set(classes.map(c => c.room))],
            syncStatus: s.syncStatus,
            eventsCreated: s.eventsCreated,
            lastSynced: s.lastSynced
        };
    });

    res.json({
        success: true,
        filters: { day, room, student, status },
        count: result.length,
        students: result
    });
}));

/**
 * GET /api/dashboard/schedule
 * Get combined schedule view (all students by day/time)
 */
router.get('/schedule', asyncHandler(async (req, res) => {
    const { day } = req.query;
    const students = getAllStudents();

    // Build schedule grid
    const schedule = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const filterDays = day ? [day] : days;

    for (const d of filterDays) {
        schedule[d] = [];
    }

    for (const student of students) {
        if (!student.timetable?.classes) continue;

        for (const classInfo of student.timetable.classes) {
            if (!filterDays.includes(classInfo.day)) continue;

            schedule[classInfo.day].push({
                time: `${classInfo.startTime} - ${classInfo.endTime}`,
                course: classInfo.course,
                room: classInfo.room,
                type: classInfo.type,
                student: student.name,
                regNo: student.regNo,
                section: classInfo.section || student.timetable.section
            });
        }
    }

    // Sort each day's classes by time
    for (const d of filterDays) {
        schedule[d].sort((a, b) => a.time.localeCompare(b.time));
    }

    res.json({
        success: true,
        schedule
    });
}));

export default router;
