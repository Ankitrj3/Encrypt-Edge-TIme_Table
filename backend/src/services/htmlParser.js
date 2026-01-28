import * as cheerio from 'cheerio';

/**
 * Parse LPU UMS Timetable Response
 * 
 * Handles both:
 * 1. Full HTML page (direct scraping)
 * 2. AJAX response (ReportViewer async update)
 */
export const parseReportViewerHtml = (html, regNo) => {
    const classes = [];
    let section = '';

    // Log raw response length for debugging
    console.log(`[Parser] Parsing response for ${regNo}, length: ${html.length}`);

    // Check if this is an AJAX response (contains delta updates)
    if (html.includes('|updatePanel|') || html.includes('pageRedirect')) {
        console.log('[Parser] Detected AJAX response format');
        return parseAjaxResponse(html, regNo);
    }

    // Standard HTML parsing
    const $ = cheerio.load(html);

    // Find all tables and look for timetable structure
    const tables = $('table');
    console.log(`[Parser] Found ${tables.length} tables`);

    let timetableTable = null;

    // Find table with weekday headers
    tables.each((i, table) => {
        const text = $(table).text();
        if ((text.includes('Monday') || text.includes('Tuesday')) &&
            (text.includes('AM') || text.includes('PM'))) {
            timetableTable = table;
            console.log(`[Parser] Found timetable table at index ${i}`);
        }
    });

    if (!timetableTable) {
        console.log('[Parser] No timetable table found, trying alternate selectors');

        // Try #ReportViewer
        const reportViewer = $('#ReportViewer, [id*="ReportViewer"]');
        if (reportViewer.length) {
            timetableTable = reportViewer.find('table').first();
        }
    }

    if (!timetableTable) {
        console.log('[Parser] Still no table, dumping first 500 chars of HTML');
        console.log(html.substring(0, 500));
        return {
            regNo,
            section: '',
            classes: [],
            parsedAt: new Date().toISOString(),
            error: 'No timetable table found'
        };
    }

    const $table = $(timetableTable);

    // Extract headers (days)
    const headers = [];
    $table.find('tr').first().find('td, th').each((i, cell) => {
        headers.push($(cell).text().trim());
    });
    console.log(`[Parser] Headers: ${headers.join(', ')}`);

    // Map day columns
    const dayMapping = {
        'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
        'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
    };

    const dayColumns = {};
    headers.forEach((header, index) => {
        const lower = header.toLowerCase();
        for (const [key, value] of Object.entries(dayMapping)) {
            if (lower.includes(key)) {
                dayColumns[index] = value;
            }
        }
    });

    // Process rows
    const rows = $table.find('tr');
    rows.each((rowIndex, row) => {
        if (rowIndex === 0) return;

        const cells = $(row).find('td, th');
        let timeSlot = null;

        cells.each((colIndex, cell) => {
            const cellText = $(cell).text().trim();

            if (colIndex === 0) {
                timeSlot = cellText;
                return;
            }

            if (!cellText || cellText === '-' || cellText === '') return;
            if (cellText.toLowerCase().includes('project work')) return;

            const day = dayColumns[colIndex];
            if (!day) return;

            const classInfo = parseCellContent(cellText, timeSlot, day);
            if (classInfo) {
                if (classInfo.section && !section) section = classInfo.section;
                classes.push(classInfo);
            }
        });
    });

    console.log(`[Parser] Extracted ${classes.length} classes`);

    return {
        regNo,
        section,
        classes,
        parsedAt: new Date().toISOString()
    };
};

/**
 * Parse AJAX response from UMS
 */
const parseAjaxResponse = (response, regNo) => {
    const classes = [];
    let section = '';

    // AJAX response contains HTML within pipe-delimited sections
    // Extract the HTML content from the update panel
    const htmlMatch = response.match(/\|updatePanel\|[^|]*\|([^|]*)\|/);

    if (htmlMatch && htmlMatch[1]) {
        // Parse the extracted HTML
        const $ = cheerio.load(htmlMatch[1]);
        // Continue parsing as above...
    }

    // Alternative: Look for table HTML directly in response
    const tableMatch = response.match(/<table[^>]*>[\s\S]*?<\/table>/gi);

    if (tableMatch && tableMatch.length > 0) {
        console.log(`[Parser] Found ${tableMatch.length} tables in AJAX response`);

        // Find the timetable table
        for (const tableHtml of tableMatch) {
            if (tableHtml.includes('Monday') || tableHtml.includes('Tuesday')) {
                const $ = cheerio.load(tableHtml);
                const $table = $('table');

                // Extract classes from this table
                const headers = [];
                $table.find('tr').first().find('td, th').each((i, cell) => {
                    headers.push($(cell).text().trim());
                });

                const dayColumns = {};
                const dayMapping = {
                    'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
                    'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday'
                };

                headers.forEach((h, i) => {
                    const lower = h.toLowerCase();
                    for (const [key, value] of Object.entries(dayMapping)) {
                        if (lower.includes(key)) dayColumns[i] = value;
                    }
                });

                $table.find('tr').each((rowIdx, row) => {
                    if (rowIdx === 0) return;

                    let timeSlot = '';
                    $(row).find('td, th').each((colIdx, cell) => {
                        const text = $(cell).text().trim();
                        if (colIdx === 0) {
                            timeSlot = text;
                            return;
                        }
                        if (!text || text === '-') return;
                        if (text.toLowerCase().includes('project work')) return;

                        const day = dayColumns[colIdx];
                        if (!day) return;

                        const info = parseCellContent(text, timeSlot, day);
                        if (info) {
                            if (info.section && !section) section = info.section;
                            classes.push(info);
                        }
                    });
                });

                break;
            }
        }
    }

    console.log(`[Parser AJAX] Extracted ${classes.length} classes`);

    return {
        regNo,
        section,
        classes,
        parsedAt: new Date().toISOString()
    };
};

/**
 * Parse cell content to extract class info
 */
const parseCellContent = (cellText, timeSlot, day) => {
    // Parse time
    const timeMatch = timeSlot?.match(/(\d{1,2})[:\-](\d{1,2})\s*(AM|PM)?/i);
    let startTime = null, endTime = null;

    if (timeMatch) {
        let startHour = parseInt(timeMatch[1]);
        let endHour = parseInt(timeMatch[2]) || startHour + 1;
        const period = timeMatch[3]?.toUpperCase();

        if (period === 'PM' && startHour !== 12) startHour += 12;
        if (period === 'PM' && endHour !== 12) endHour += 12;
        if (period === 'AM' && startHour === 12) startHour = 0;

        if (!period && startHour <= 8) {
            startHour += 12;
            endHour += 12;
        }

        startTime = `${startHour.toString().padStart(2, '0')}:00`;
        endTime = `${endHour.toString().padStart(2, '0')}:00`;
    }

    // Pattern 1: "Lecture / G:All C:CSE439 / R: 26-307 / S:2C156"
    let match = cellText.match(/(Lecture|Practical|Tutorial|Lab)\s*\/?\s*G:[^\s]*\s*C:([A-Z]+\d+)\s*\/?\s*R:\s*([^\s\/]+)\s*\/?\s*S:([^\s]+)/i);
    if (match) {
        return {
            day, startTime, endTime,
            course: match[2].trim(),
            room: match[3].trim(),
            section: match[4].trim(),
            type: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
        };
    }

    // Pattern 2: "INT219 Lec 25-306 K22FL"
    match = cellText.match(/([A-Z]+\d+)\s+(Lec|Prac|Lab|Tut)\w*\s+(\d+[-\d]*)\s+([A-Z0-9]+)/i);
    if (match) {
        const typeMap = { 'lec': 'Lecture', 'prac': 'Practical', 'lab': 'Lab', 'tut': 'Tutorial' };
        return {
            day, startTime, endTime,
            course: match[1].trim(),
            room: match[3].trim(),
            section: match[4].trim(),
            type: typeMap[match[2].toLowerCase()] || 'Lecture'
        };
    }

    // Pattern 3: Generic course code extraction
    const courseMatch = cellText.match(/\b([A-Z]{2,4}\d{3,4})\b/);
    const roomMatch = cellText.match(/\b(\d{1,2}[-\s]?\d{2,4})\b/);

    if (courseMatch) {
        return {
            day, startTime, endTime,
            course: courseMatch[1],
            room: roomMatch ? roomMatch[1] : 'TBD',
            section: extractSection(cellText),
            type: cellText.toLowerCase().includes('prac') ? 'Practical' : 'Lecture'
        };
    }

    return null;
};

const extractSection = (text) => {
    const match = text.match(/S:\s*([A-Z0-9]+)|([A-Z]\d{2}[A-Z]{2})/i);
    return match ? (match[1] || match[2]) : '';
};

export const validateTimetable = (timetable) => {
    if (!timetable || !timetable.classes || timetable.classes.length === 0) {
        return { valid: false, error: 'No classes found in timetable' };
    }
    return { valid: true };
};
