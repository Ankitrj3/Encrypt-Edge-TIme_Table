/**
 * Time parsing utilities for LPU timetable
 */

// Convert time like "11-12 AM" or "02-03 PM" to 24h format
export const parseTimeSlot = (timeSlot) => {
    const match = timeSlot.match(/(\d{1,2})-(\d{1,2})\s*(AM|PM)/i);
    if (!match) return null;

    let startHour = parseInt(match[1]);
    let endHour = parseInt(match[2]);
    const period = match[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && startHour !== 12) {
        startHour += 12;
    }
    if (period === 'PM' && endHour !== 12) {
        endHour += 12;
    }
    if (period === 'AM' && startHour === 12) {
        startHour = 0;
    }
    if (period === 'AM' && endHour === 12) {
        endHour = 0;
    }

    return {
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`
    };
};

// Get day index (0=Monday, 6=Sunday)
export const getDayIndex = (day) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.indexOf(day.toLowerCase());
};

// Get next occurrence of a weekday
export const getNextWeekday = (dayName) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const targetDay = days.indexOf(dayName.toLowerCase());
    const currentDay = today.getDay();

    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
    }

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate;
};

// Format date for Google Calendar (YYYY-MM-DD)
export const formatDateForCalendar = (date) => {
    return date.toISOString().split('T')[0];
};

// Get RRULE day code
export const getRRuleDay = (day) => {
    const mapping = {
        'monday': 'MO',
        'tuesday': 'TU',
        'wednesday': 'WE',
        'thursday': 'TH',
        'friday': 'FR',
        'saturday': 'SA',
        'sunday': 'SU'
    };
    return mapping[day.toLowerCase()];
};
