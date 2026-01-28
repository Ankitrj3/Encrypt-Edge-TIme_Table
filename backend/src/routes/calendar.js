import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { getAuthUrl, oauth2Client } from '../config/google.js';
import { config } from '../config/env.js';
import {
    setTokens,
    isAuthenticated,
    syncTimetableToCalendar,
    deleteStudentEvents
} from '../services/calendarService.js';
import { getStudent, getAllStudents, updateSyncStatus } from '../services/storageService.js';

const router = Router();

/**
 * GET /api/auth/google
 * Redirect to Google OAuth consent screen
 */
router.get('/google', (req, res) => {
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
});

/**
 * GET /api/auth/callback
 * Google OAuth callback
 */
router.get('/callback', asyncHandler(async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        throw new AppError(`Google auth error: ${error}`, 400);
    }

    if (!code) {
        throw new AppError('Authorization code not provided', 400);
    }

    await setTokens(code);

    // Redirect to frontend with success
    res.redirect(`${config.frontendUrl}?auth=success`);
}));

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        authenticated: isAuthenticated()
    });
});

/**
 * POST /api/calendar/sync
 * Sync timetable to Google Calendar
 */
router.post('/sync', asyncHandler(async (req, res) => {
    const { regNo, regNos, selectedClasses } = req.body;

    if (!isAuthenticated()) {
        throw new AppError('Not authenticated with Google. Please login first.', 401);
    }

    // Support single or multiple regNos
    const registrationNumbers = regNos || (regNo ? [regNo] : []);

    if (registrationNumbers.length === 0) {
        throw new AppError('regNo or regNos is required', 400);
    }

    const results = {
        success: [],
        failed: []
    };

    for (const regNum of registrationNumbers) {
        const student = getStudent(regNum);

        if (!student) {
            results.failed.push({
                regNo: regNum,
                error: 'Student not found'
            });
            continue;
        }

        if (!student.timetable) {
            results.failed.push({
                regNo: regNum,
                error: 'Timetable not fetched. Fetch timetable first.'
            });
            continue;
        }

        try {
            // Filter classes if selectedClasses is provided
            let classesToSync = student.timetable.classes;
            if (selectedClasses && selectedClasses[regNum]) {
                const selectedIndices = selectedClasses[regNum];
                classesToSync = student.timetable.classes.filter((_, idx) =>
                    selectedIndices.includes(idx)
                );
            }

            const timetableToSync = {
                ...student.timetable,
                classes: classesToSync
            };

            const syncResult = await syncTimetableToCalendar(timetableToSync, {
                name: student.name,
                regNo: student.regNo
            });

            // Update sync status
            await updateSyncStatus(
                regNum,
                syncResult.failed.length === 0 ? 'synced' : 'partial',
                syncResult.success.length
            );

            results.success.push({
                regNo: regNum,
                name: student.name,
                eventsCreated: syncResult.success.length,
                eventsFailed: syncResult.failed.length,
                eventsSkipped: syncResult.skipped.length,
                details: syncResult
            });
        } catch (error) {
            await updateSyncStatus(regNum, 'failed', 0);
            results.failed.push({
                regNo: regNum,
                error: error.message
            });
        }
    }

    res.json({
        success: true,
        synced: results.success.length,
        failed: results.failed.length,
        results
    });
}));

/**
 * POST /api/calendar/sync-all
 * Sync all students to Google Calendar
 */
router.post('/sync-all', asyncHandler(async (req, res) => {
    if (!isAuthenticated()) {
        throw new AppError('Not authenticated with Google. Please login first.', 401);
    }

    const students = getAllStudents().filter(s => s.timetable);

    if (students.length === 0) {
        throw new AppError('No students with timetables found. Fetch timetables first.', 400);
    }

    const results = {
        success: [],
        failed: []
    };

    for (const student of students) {
        try {
            const syncResult = await syncTimetableToCalendar(student.timetable, {
                name: student.name,
                regNo: student.regNo
            });

            await updateSyncStatus(
                student.regNo,
                syncResult.failed.length === 0 ? 'synced' : 'partial',
                syncResult.success.length
            );

            results.success.push({
                regNo: student.regNo,
                name: student.name,
                eventsCreated: syncResult.success.length
            });
        } catch (error) {
            await updateSyncStatus(student.regNo, 'failed', 0);
            results.failed.push({
                regNo: student.regNo,
                name: student.name,
                error: error.message
            });
        }
    }

    res.json({
        success: true,
        message: `Synced ${results.success.length} student(s) to Google Calendar`,
        results
    });
}));

/**
 * DELETE /api/calendar/events/:regNo
 * Delete all calendar events for a student
 */
router.delete('/events/:regNo', asyncHandler(async (req, res) => {
    const { regNo } = req.params;

    if (!isAuthenticated()) {
        throw new AppError('Not authenticated with Google. Please login first.', 401);
    }

    const result = await deleteStudentEvents(regNo);

    // Reset sync status
    await updateSyncStatus(regNo, 'pending', 0);

    res.json({
        success: true,
        message: `Deleted ${result.deleted} event(s) for ${regNo}`
    });
}));

export default router;
