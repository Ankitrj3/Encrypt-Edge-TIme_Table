/**
 * Postman HTML Response Parser
 * 
 * Usage:
 * 1. Save all 18 HTML responses from Postman to a file: backend/data/postman_responses.txt
 *    Format: Each response separated by "user X" (e.g., "user 1", "user 2", etc.)
 * 2. Run: node scripts/parsePostmanResponses.js
 */

import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Student mapping (name to regNo)
const STUDENTS = [
    { name: 'Paramjit Singh', regNo: '12311061', phone: '9876543210' },
    { name: 'Parth Narula', regNo: '12500362', phone: '9876543211' },
    { name: 'Ashish Kumar Singh', regNo: '12300608', phone: '9876543212' },
    { name: 'Yash Yadav', regNo: '12309583', phone: '9876543213' },
    { name: 'Prabal', regNo: '12512197', phone: '9876543214' },
    { name: 'Aryan Kumar', regNo: '12218679', phone: '9876543215' },
    { name: 'Kumar Ayush', regNo: '12310661', phone: '9876543216' },
    { name: 'Shaun Beniel Edwin', regNo: '12218394', phone: '9876543217' },
    { name: 'Md Arfaa Taj', regNo: '12313447', phone: '9876543218' },
    { name: 'Anubhav Jaiswal', regNo: '12302387', phone: '9876543219' },
    { name: 'Anshul Choudhary', regNo: '12205969', phone: '9876543220' },
    { name: 'Gagandeep Singh', regNo: '12322960', phone: '9876543221' },
    { name: 'Shashank Pandey', regNo: '12317758', phone: '9876543222' },
    { name: 'Priya Jantwal', regNo: '12320951', phone: '9876543223' },
    { name: 'Aditya Raj', regNo: '12307796', phone: '9876543224' },
    { name: 'Ankit Ranjan', regNo: '12000777', phone: '8603995362' },
    { name: 'Rajvardhan Singh', regNo: '12303815', phone: '7388742727' },
    { name: 'Guddu Kumar Das', regNo: '12309867', phone: '9905200483' }
];

// Parse single HTML response
function parseTimetableHtml(html) {
    const classes = [];
    let section = '';
    let regNo = '';

    const $ = cheerio.load(html);

    // Extract registration number (VID)
    const vidMatch = html.match(/Time Table for VID\s*:<\/DIV>.*?>(\d+)</i);
    if (vidMatch) {
        regNo = vidMatch[1];
    }

    // Extract section
    const sectionMatch = html.match(/Home Section\s*:<\/DIV>.*?>([A-Z0-9]+)</i);
    if (sectionMatch) {
        section = sectionMatch[1];
    }

    // Day mapping
    const dayMapping = {
        'monday': 'Monday',
        'tuesday': 'Tuesday',
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
    };

    // Find timetable table by looking for day headers
    $('table').each((tableIdx, table) => {
        const tableHtml = $(table).html() || '';

        // Check if this table has day columns
        if (tableHtml.toLowerCase().includes('monday') && tableHtml.toLowerCase().includes('tuesday')) {

            // Get headers to map column indices to days
            const headers = [];
            $(table).find('tr').first().find('td, th').each((i, cell) => {
                headers.push($(cell).text().trim().toLowerCase());
            });

            const dayColumns = {};
            headers.forEach((h, i) => {
                for (const [key, value] of Object.entries(dayMapping)) {
                    if (h.includes(key)) {
                        dayColumns[i] = value;
                    }
                }
            });

            // Process data rows
            $(table).find('tr').each((rowIdx, row) => {
                if (rowIdx === 0) return; // Skip header row

                let timeSlot = '';
                $(row).find('td, th').each((colIdx, cell) => {
                    const text = $(cell).text().trim();

                    // First column is timing
                    if (colIdx === 0) {
                        timeSlot = text;
                        return;
                    }

                    // Skip empty cells
                    if (!text || text === '-' || text === '' || text === ' ') return;

                    // Skip project work
                    if (text.toLowerCase().includes('project work')) return;

                    const day = dayColumns[colIdx];
                    if (!day) return;

                    // Parse time (e.g., "03-04 PM")
                    const timeMatch = timeSlot.match(/(\d{1,2})-(\d{1,2})\s*(AM|PM)?/i);
                    let startTime = null, endTime = null;

                    if (timeMatch) {
                        let startHour = parseInt(timeMatch[1]);
                        let endHour = parseInt(timeMatch[2]);
                        const period = timeMatch[3]?.toUpperCase() || 'PM';

                        if (period === 'PM' && startHour !== 12) startHour += 12;
                        if (period === 'PM' && endHour !== 12) endHour += 12;
                        if (period === 'AM' && startHour === 12) startHour = 0;
                        if (period === 'AM' && endHour === 12) endHour = 0;

                        startTime = `${startHour.toString().padStart(2, '0')}:00`;
                        endTime = `${endHour.toString().padStart(2, '0')}:00`;
                    }

                    // Parse cell content: "Lecture / G:All C:CSE310 / R: 25-301 / S:K22EI"
                    const courseMatch = text.match(/C:([A-Z0-9]+)/);
                    const roomMatch = text.match(/R:\s*([^\s\/]+)/);
                    const sectionMatch = text.match(/S:([A-Z0-9]+)/);
                    const isLecture = text.toLowerCase().includes('lecture');
                    const isTutorial = text.toLowerCase().includes('tutorial');
                    const isPractical = text.toLowerCase().includes('practical');

                    if (courseMatch) {
                        if (sectionMatch && !section) section = sectionMatch[1];

                        classes.push({
                            day,
                            startTime,
                            endTime,
                            course: courseMatch[1],
                            room: roomMatch ? roomMatch[1] : 'TBD',
                            type: isPractical ? 'Practical' : (isTutorial ? 'Tutorial' : 'Lecture'),
                            selected: true
                        });
                    }
                });
            });
        }
    });

    return { regNo, section, classes };
}

// Main function
async function main() {
    console.log('========================================');
    console.log('Postman Response Parser');
    console.log('========================================\n');

    const inputPath = path.join(__dirname, '../data/postman_responses.txt');

    if (!fs.existsSync(inputPath)) {
        console.log('❌ File not found: data/postman_responses.txt');
        console.log('\nPlease create this file with your Postman responses.');
        console.log('Format: Paste all responses, separate each user with "user X" line\n');

        // Create sample file
        const sampleContent = `user 1
[Paste HTML response for student 1 here]

user 2
[Paste HTML response for student 2 here]

...continue for all 18 students...
`;
        fs.writeFileSync(inputPath, sampleContent);
        console.log('✓ Created sample file at data/postman_responses.txt');
        console.log('  Edit this file with your actual Postman responses and run again.');
        return;
    }

    const content = fs.readFileSync(inputPath, 'utf-8');

    // Split by "user X" pattern
    const userBlocks = content.split(/user\s*\d+/i).filter(block => block.trim().length > 100);

    console.log(`Found ${userBlocks.length} response blocks\n`);

    const results = [];

    for (let i = 0; i < userBlocks.length && i < STUDENTS.length; i++) {
        const student = STUDENTS[i];
        const html = userBlocks[i];

        console.log(`Parsing: ${student.name} (${student.regNo})...`);

        const timetable = parseTimetableHtml(html);

        results.push({
            name: student.name,
            regNo: student.regNo,
            phone: student.phone,
            hasTimetable: timetable.classes.length > 0,
            timetable: timetable.classes.length > 0 ? {
                section: timetable.section,
                classes: timetable.classes
            } : null,
            eventsCreated: 0,
            lastSynced: null,
            syncStatus: 'pending'
        });

        console.log(`  ✓ Found ${timetable.classes.length} classes (Section: ${timetable.section || 'N/A'})`);
    }

    // Save to JSON
    const output = {
        students: results,
        lastUpdated: new Date().toISOString()
    };

    const outputPath = path.join(__dirname, '../data/students.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log('\n========================================');
    console.log(`✓ Saved ${results.length} students to data/students.json`);
    console.log(`✓ Total classes parsed: ${results.reduce((sum, s) => sum + (s.timetable?.classes?.length || 0), 0)}`);
    console.log('========================================');
}

main().catch(console.error);
