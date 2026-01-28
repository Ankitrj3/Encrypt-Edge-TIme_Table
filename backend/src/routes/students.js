import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { importStudents, getAllStudents, deleteStudent } from '../services/storageService.js';

const router = Router();

/**
 * POST /api/students/import
 * Import bulk students
 */
router.post('/import', asyncHandler(async (req, res) => {
    const students = req.body;

    // Validate input
    if (!Array.isArray(students) || students.length === 0) {
        throw new AppError('Invalid input. Expected array of students.', 400);
    }

    // Validate each student
    const errors = [];
    students.forEach((student, index) => {
        if (!student.name || !student.regNo || !student.phone) {
            errors.push(`Student at index ${index}: name, regNo, and phone are required`);
        }
        if (student.regNo && !/^\d{8}$/.test(student.regNo)) {
            errors.push(`Student at index ${index}: regNo must be 8 digits`);
        }
        if (student.phone && !/^\d{10}$/.test(student.phone)) {
            errors.push(`Student at index ${index}: phone must be 10 digits`);
        }
    });

    if (errors.length > 0) {
        throw new AppError(`Validation errors: ${errors.join('; ')}`, 400);
    }

    const result = await importStudents(students);

    res.json({
        success: true,
        message: `Imported ${students.length} student(s)`,
        students: result.map(s => ({
            regNo: s.regNo,
            name: s.name,
            phone: s.phone,
            syncStatus: s.syncStatus
        }))
    });
}));

/**
 * GET /api/students
 * Get all students
 */
router.get('/', asyncHandler(async (req, res) => {
    const students = getAllStudents();

    res.json({
        success: true,
        count: students.length,
        students: students.map(s => ({
            regNo: s.regNo,
            name: s.name,
            phone: s.phone,
            hasTimetable: !!s.timetable,
            classCount: s.timetable?.classes?.length || 0,
            syncStatus: s.syncStatus,
            lastSynced: s.lastSynced
        }))
    });
}));

/**
 * DELETE /api/students/:regNo
 * Delete a student
 */
router.delete('/:regNo', asyncHandler(async (req, res) => {
    const { regNo } = req.params;
    const deleted = await deleteStudent(regNo);

    if (!deleted) {
        throw new AppError(`Student with regNo ${regNo} not found`, 404);
    }

    res.json({
        success: true,
        message: `Student ${regNo} deleted`
    });
}));

export default router;
