import { oauth2Client, getCalendar } from '../config/google.js';
import { getNextWeekday, getRRuleDay } from '../utils/timeUtils.js';

// Store tokens in memory (in production, use secure storage)
let tokens = null;

/**
 * Set OAuth tokens
 */
export const setTokens = async (code) => {
    const { tokens: newTokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(newTokens);
    tokens = newTokens;
    return newTokens;
};

/**
 * Check if authenticated
 */
export const isAuthenticated = () => {
    return tokens !== null;
};

/**
 * Get current tokens
 */
export const getTokens = () => tokens;

/**
 * Refresh tokens if needed
 */
export const refreshTokensIfNeeded = async () => {
    if (!tokens) {
        throw new Error('Not authenticated. Please authenticate with Google first.');
    }

    if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
        const { credentials } = await oauth2Client.refreshAccessToken();
        tokens = credentials;
        oauth2Client.setCredentials(tokens);
    }
};

/**
 * Create a calendar event for a class
 * 
 * @param {Object} classInfo - Class information
 * @param {Object} studentInfo - Student information
 * @returns {Promise<Object>} - Created event
 */
export const createCalendarEvent = async (classInfo, studentInfo) => {
    await refreshTokensIfNeeded();

    const calendar = getCalendar();

    // Get next occurrence of the class day
    const startDate = getNextWeekday(classInfo.day);
    const endDate = new Date(startDate);

    // Parse times
    const [startHour, startMin] = classInfo.startTime.split(':').map(Number);
    const [endHour, endMin] = classInfo.endTime.split(':').map(Number);

    startDate.setHours(startHour, startMin, 0, 0);
    endDate.setHours(endHour, endMin, 0, 0);

    // Create event
    const event = {
        summary: `${classInfo.course} - Room ${classInfo.room}`,
        description: `Student: ${studentInfo.name}
Reg No: ${studentInfo.regNo}
Section: ${classInfo.section || studentInfo.section || 'N/A'}
Type: ${classInfo.type || 'Lecture'}
Room: ${classInfo.room}`,
        location: `Room ${classInfo.room}`,
        start: {
            dateTime: startDate.toISOString(),
            timeZone: 'Asia/Kolkata'
        },
        end: {
            dateTime: endDate.toISOString(),
            timeZone: 'Asia/Kolkata'
        },
        recurrence: [
            `RRULE:FREQ=WEEKLY;BYDAY=${getRRuleDay(classInfo.day)}`
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 10 }
            ]
        },
        colorId: classInfo.type === 'Practical' ? '5' : '9' // Yellow for practical, blue for lecture
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        console.log(`[Calendar] Created event: ${event.summary} on ${classInfo.day}`);
        return response.data;
    } catch (error) {
        console.error(`[Calendar] Failed to create event: ${error.message}`);
        throw error;
    }
};

/**
 * Sync all classes for a student to Google Calendar
 * 
 * @param {Object} timetable - Parsed timetable
 * @param {Object} studentInfo - Student information
 * @returns {Promise<Object>} - Sync result
 */
export const syncTimetableToCalendar = async (timetable, studentInfo) => {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated. Please authenticate with Google first.');
    }

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    for (const classInfo of timetable.classes) {
        // Skip if incomplete data
        if (!classInfo.startTime || !classInfo.endTime || !classInfo.day) {
            results.skipped.push({
                class: classInfo,
                reason: 'Incomplete time or day information'
            });
            continue;
        }

        try {
            const event = await createCalendarEvent(classInfo, {
                ...studentInfo,
                section: timetable.section
            });
            results.success.push({
                class: classInfo,
                eventId: event.id,
                eventLink: event.htmlLink
            });
        } catch (error) {
            results.failed.push({
                class: classInfo,
                error: error.message
            });
        }

        // Rate limiting - wait 200ms between event creations
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
};

/**
 * Delete all events with specific description pattern
 * (Useful for cleanup/re-sync)
 */
export const deleteStudentEvents = async (regNo) => {
    await refreshTokensIfNeeded();

    const calendar = getCalendar();

    try {
        // List events with student's regNo in description
        const response = await calendar.events.list({
            calendarId: 'primary',
            q: regNo,
            maxResults: 100
        });

        const events = response.data.items || [];
        let deleted = 0;

        for (const event of events) {
            if (event.description && event.description.includes(regNo)) {
                await calendar.events.delete({
                    calendarId: 'primary',
                    eventId: event.id
                });
                deleted++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return { deleted };
    } catch (error) {
        throw new Error(`Failed to delete events: ${error.message}`);
    }
};
