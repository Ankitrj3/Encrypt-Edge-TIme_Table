import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { fetchTimetable } from '../services/timetableFetcher.js';
import { parseReportViewerHtml, validateTimetable } from '../services/htmlParser.js';
import { getStudent, updateStudentTimetable, getAllStudents } from '../services/storageService.js';

const router = Router();

/**
 * POST /api/timetable/fetch
 * Fetch and parse timetable for student(s)
 */
router.post('/fetch', asyncHandler(async (req, res) => {
    const { regNo, regNos } = req.body;

    // Support both single regNo and array of regNos
    const registrationNumbers = regNos || (regNo ? [regNo] : []);

    if (registrationNumbers.length === 0) {
        throw new AppError('regNo or regNos is required', 400);
    }

    const results = {
        success: [],
        failed: []
    };

    for (const regNum of registrationNumbers) {
        try {
            // Fetch HTML
            const html = await fetchTimetable(regNum);

            // Parse HTML
            const timetable = parseReportViewerHtml(html, regNum);

            // Validate
            const validation = validateTimetable(timetable);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Update student record
            const student = getStudent(regNum);
            if (student) {
                await updateStudentTimetable(regNum, timetable);
            }

            results.success.push({
                regNo: regNum,
                section: timetable.section,
                classCount: timetable.classes.length,
                classes: timetable.classes,
                warnings: validation.warnings
            });
        } catch (error) {
            results.failed.push({
                regNo: regNum,
                error: error.message
            });
        }
    }

    res.json({
        success: true,
        fetched: results.success.length,
        failed: results.failed.length,
        results
    });
}));

/**
 * GET /api/timetable/:regNo
 * Get parsed timetable for a student
 */
router.get('/:regNo', asyncHandler(async (req, res) => {
    const { regNo } = req.params;

    const student = getStudent(regNo);

    if (!student) {
        throw new AppError(`Student ${regNo} not found`, 404);
    }

    if (!student.timetable) {
        throw new AppError(`Timetable not fetched for ${regNo}. Fetch it first.`, 400);
    }

    res.json({
        success: true,
        regNo: student.regNo,
        name: student.name,
        timetable: student.timetable
    });
}));

/**
 * POST /api/timetable/fetch-all
 * Fetch timetables for all stored students
 */
router.post('/fetch-all', asyncHandler(async (req, res) => {
    const students = getAllStudents();

    if (students.length === 0) {
        throw new AppError('No students found. Import students first.', 400);
    }

    const results = {
        success: [],
        failed: []
    };

    for (const student of students) {
        try {
            const html = await fetchTimetable(student.regNo);
            const timetable = parseReportViewerHtml(html, student.regNo);
            const validation = validateTimetable(timetable);

            if (!validation.valid) {
                throw new Error(validation.error);
            }

            await updateStudentTimetable(student.regNo, timetable);

            results.success.push({
                regNo: student.regNo,
                name: student.name,
                classCount: timetable.classes.length
            });
        } catch (error) {
            results.failed.push({
                regNo: student.regNo,
                name: student.name,
                error: error.message
            });
        }
    }

    res.json({
        success: true,
        message: `Fetched timetables for ${results.success.length} students`,
        results
    });
}));

export default router;
