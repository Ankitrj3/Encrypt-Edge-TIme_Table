/**
 * LPU Timetable Fetcher
 * 
 * Timetable data is stored directly in students.json
 * No external API calls needed - timetables are pre-populated
 */

/**
 * "Fetch" timetable - Returns data from pre-populated JSON
 * The actual timetable data is already in students.json
 */
export const fetchTimetable = async (regNo) => {
  if (!regNo || !/^\d{8}$/.test(regNo)) {
    throw new Error(`Invalid registration number: ${regNo}. Must be 8 digits.`);
  }

  console.log(`[Timetable] Loading timetable for: ${regNo}`);

  // Timetable data is already in students.json
  // This function just validates and returns confirmation
  // The actual data loading happens in the storage layer

  return {
    success: true,
    regNo,
    message: 'Timetable loaded from storage'
  };
};

/**
 * Check if timetable service is available
 */
export const checkConnection = async () => {
  return {
    connected: true,
    message: 'Using local JSON storage'
  };
};
