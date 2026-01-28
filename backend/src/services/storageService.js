import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../data/students.json');

// In-memory store
let studentsData = {
    students: [],
    lastUpdated: null
};

// Initialize data from file
export const initStorage = async () => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        studentsData = JSON.parse(data);
    } catch (err) {
        // File doesn't exist, create it
        await saveData();
    }
};

// Save data to file
const saveData = async () => {
    studentsData.lastUpdated = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(studentsData, null, 2));
};

// Add or update students
export const importStudents = async (students) => {
    for (const student of students) {
        const existing = studentsData.students.find(s => s.regNo === student.regNo);
        if (existing) {
            // Update existing
            Object.assign(existing, {
                name: student.name,
                phone: student.phone,
                updatedAt: new Date().toISOString()
            });
        } else {
            // Add new
            studentsData.students.push({
                ...student,
                timetable: null,
                eventsCreated: 0,
                lastSynced: null,
                syncStatus: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    }
    await saveData();
    return studentsData.students;
};

// Get all students
export const getAllStudents = () => {
    return studentsData.students;
};

// Get student by regNo
export const getStudent = (regNo) => {
    return studentsData.students.find(s => s.regNo === regNo);
};

// Update student timetable
export const updateStudentTimetable = async (regNo, timetable) => {
    const student = studentsData.students.find(s => s.regNo === regNo);
    if (student) {
        student.timetable = timetable;
        student.updatedAt = new Date().toISOString();
        await saveData();
    }
    return student;
};

// Update sync status
export const updateSyncStatus = async (regNo, status, eventsCreated = 0) => {
    const student = studentsData.students.find(s => s.regNo === regNo);
    if (student) {
        student.syncStatus = status;
        student.eventsCreated = eventsCreated;
        student.lastSynced = new Date().toISOString();
        student.updatedAt = new Date().toISOString();
        await saveData();
    }
    return student;
};

// Get dashboard stats
export const getDashboardStats = () => {
    const students = studentsData.students;

    const stats = {
        totalStudents: students.length,
        synced: students.filter(s => s.syncStatus === 'synced').length,
        pending: students.filter(s => s.syncStatus === 'pending').length,
        failed: students.filter(s => s.syncStatus === 'failed').length,
        totalEvents: students.reduce((sum, s) => sum + (s.eventsCreated || 0), 0)
    };

    return {
        stats,
        students: students.map(s => ({
            regNo: s.regNo,
            name: s.name,
            phone: s.phone,
            totalClasses: s.timetable?.classes?.length || 0,
            rooms: [...new Set(s.timetable?.classes?.map(c => c.room) || [])],
            syncStatus: s.syncStatus,
            eventsCreated: s.eventsCreated,
            lastSynced: s.lastSynced
        })),
        lastUpdated: studentsData.lastUpdated
    };
};

// Delete student
export const deleteStudent = async (regNo) => {
    const index = studentsData.students.findIndex(s => s.regNo === regNo);
    if (index !== -1) {
        studentsData.students.splice(index, 1);
        await saveData();
        return true;
    }
    return false;
};
