/**
 * LPU UMS Timetable Fetcher Script
 * 
 * Usage:
 * 1. Login to UMS in your browser
 * 2. Open DevTools → Network → find a request to UMS
 * 3. Copy the Cookie header value  
 * 4. Update the COOKIES variable below
 * 5. Run: node scripts/fetchAllTimetables.js
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION - UPDATE THIS WITH FRESH COOKIES
// ============================================
const COOKIES = '_gid=GA1.2.973911440.1769032777; cf_clearance=G2O1Ht_sPwzvLp3EPsMG2JoioH9GwJgzUYPqbCh4eYI-1769035628-1.2.1.1-BE6MsEyMwK6mNzHmg0ucjTlFiERBWJutu1I3Eo420ymThJImLrbIicc8V.wq6H51CiQZz2ZMGRHpX3022GsZJ.PWh4V2NVOO4XXzvJ0hnrcPVivCgI8zI7l_ZwUgRWKquuCXL8Ay2CCwZdpBpViFQkuuJY1bxVRwH_twxQKqpRD8RVKPI_IDNFQbPrHTpeRl3yY82ZYqu4taespEQ8tUGcKt_9xmcH42Yx1JIMb2Bh0; _ga_B0Z6G6GCD8=gsqb31qhefiajctb1jxyizkd; _fbp=fb.1.1769326182302.945651301760538812; _gcl_au=1.1.651915595.1769326182; _clck=1g001yf^2^g30^0^2216; _uetsid=9da28620f9bf11f085b2698cad3134d2|1uqa9rh|2|g30|0|2216; _uetvid=5926bd40d9a211f09de581191608f0c1|1sqx5yp|1769326183514|1|1|bat.bing.com/p/insights/c/i; _clsk=zu950c^1769326183982^1^1^i.clarity.ms/collect; _ga_WKLQCVXZ47=GS2.1.s1769326182$o1$g0$t1769327713$j60$l0$h0; _ga=GA1.2.1165112884.1769032777; _ga_B0Z6D6GCD8=GS2.2.s1769369685$o15$g1$t1769369698$j47$l0$h0; 32622=Y; Suraj Mani Kumar=Y';

// All student registration numbers
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

const UMS_URL = 'https://ums.lpu.in/lpuums/Reports/frmStudentTimeTable.aspx';

// Build request body
function buildRequestBody(regNo) {
    return `RadScriptManager1=RadScriptManager1%7CReportViewerabcd%24ctl10%24Reserved_AsyncLoadTarget&RadScriptManager1_TSM=%3B%3BSystem.Web.Extensions%2C%20Version%3D4.0.0.0%2C%20Culture%3Dneutral%2C%20PublicKeyToken%3D31bf3856ad364e35%3Aen-US%3Aa8328cc8-0a99-4e41-8fe3-b58afac64e45%3Aea597d4b%3Ab25378d2%3A76254418&__EVENTTARGET=ReportViewerabcd%24ctl10%24Reserved_AsyncLoadTarget&__EVENTARGUMENT=&__VSTATE=H4sIAAAAAAAEAL1WUU%2FjRhCO1zaEQAlqj6i6Sr5cBRL0SGQHHCc98VC4pqqunFLCQd%2BiTXbsrHBsut5A6VN%2FQvvSf9SfVV1nnQQauObiqqqjzK7X33zz7ezu2O%2B04qeaaXW7x3EkRRwmp%2FDjiAtox4k8ov3L13Db7ZaemuVTuIqFPOdwA4L2%2BmzrLA6CENpU0OEWHwZm9RGiL0O7nlp7q8VFIif91GbEOwvjnYz8zoTfmYtvC7jm8SiZmUJml0xRnOxRpnOpzHV5Az%2FNLkUm%2BMLsTjb2xbR%2FR5Ms2h%2FAF2ZfTPsD%2BPw96vxd9gJ79DF%2Bcf5FzsBj%2FHx%2BN6N%2BN6Oeekb%2B%2Bnv4n74X31D1qWiuNOx688DzXG%2BDsRIhepGVCsQsloi1fM4T3gthwMhyEQee5QLGyMp9d%2FW%2B%2B1HxyYscehWs9baI%2B5AkPApOYgaru79qJ7wv4iT25UQ5PqpeQK8Vi2FSnYXvlR%2BCx7Lv8HvlcxAJj6NDx66mv73y8SiUIwGHEYykoOFeuT3qhbyPVfosvoTosGfv%2B67v%2BY7DXJvuU81aP4WIgcCgHUklivx9vsjx0KzT%2FyJVtz7pDOKbYwEMIslpmHwlgA6sdTWavmZAYpCBtdZBLWF4RkUAkrGd3R86t4mEYfWbEWd75WHSj0XIe%2FeaDhaW5HnU7bt1p7l%2FAHajueVD04X6vl9p9JpO5QBovULBZZWmf1B3a47r9GyHaLgf1N8gGsNG39kVE0GvBL1RyW1jJtMsn6BmHmG6ZgH%2FRuqD7H3s2Og1Y2p%2FkJyWy%2BXe4aVada0RNN%2F%2F59FNxf%2F8n2bdplcgOvxnMBFlXPKIGRGupnnDmRwsDYAHA%2FlZHxdbAju6fQU%2BxfD4PZJIMerLWBgfZn%2BNpGpq%2BbymGvNPnPOHPRTv8jUNR9Dt5vJkkqMlQ9mXei73m%2BqtBmm10LBaEH9q1vA%2BrQiDaSUh4xHLOMMXmpl3arZte56HBYOkT4l6aJ6rYKbp4%2B4GNvabcBZLeawvVqGF32HdN5ieZFNbxoVhNKLWSjqqUrjzxeeTaeHZq779VjXTT7eqQr2NuNQbV9Iyus87R%2BSXNVYy%2FIkCpXgJppL84gbb2CwU2jSA8oVai8LFIA6hrAYM17a3jZoyjqsM9nTP3dbxRq9h69jbm4UVBU1d861RGKo7BNg6%2BunohiCbeC5xbVJziWM%2FeaEXgrurpBGTYf2dZufZ8l1ilmaSjfpV1zITeRuCuXGtijUPubz9MoojeDlOJB6%2FtJR%2FHVGs5AxLuTEmVSoYKUzWaBynlcb5C3ZsSkP9CgAA&__VIEWSTATE=&__EVENTVALIDATION=NH2kGxWMdWX6AEya4TC%2BhFis%2B6g4ZW3458rpt1WzhEsgMMM%2F6IDceYj7YeA7LWknkBV8eXkLHxf5flJiGT2VSR8VRBfPt1OvplnqwSFzUQ1U7JoM%2BujqEMFqprGHR84Hqdu045ew9nf8pOavCAItl65pV3eRLX6joA7D3oPSKY5Fdwn%2Fmw4DMJEFRE%2BIMx53S6%2BiTiWnUweQ5W33VTfH1T7hbcCY1glli4Bmgyj71d8%2Fs2lIITzEMrqGAjGHTu77sFBCRnC%2FpmxI9%2F1mvsuyeCub5XOVwVuFrlyMLsCBIwswPlzMRHTeG%2FB5xml6nXZysDiZs2sxYwNUj9kGR%2BnPKYTs8ijmL54iMvDBgoKmaX5nIBtjwa9om7q2mhE1N8SOLFDue1Bas0YS0w2OTt0X4ARBsKXecVEGPxlf5D9L1GTA87gPPYhp%2BEe%2BhziFeMn9RyMW%2Bz2tWuXOhYcnpLDVCqRGz3XbK0RoYiQRK%2BEqMcphDM96cbWCFwSLyjrcuDuOtfMG6xuaJyx2F5xdRpd%2FIXSqOB7ebqO6fkgJj15iL5d7VGR6MiQkifXzIARcThtEsa6ueOdBvL3H%2FlQBPW5d8a5tvwPTlmfW048Jj5aGwzmEFR2yaD8ZJb9DHD%2FXmbtumoNCOiblkM6mYfAfoHM0CWK1szEIGZnAPEDjT1dhvTKwVIlxg%2Brm0%2B9KjBZ%2BlpE95e4gIIYU6B6FlpH%2F9xq8gW3WQG1ZFV2U%2FGyzjNY8Py5cgK2gVDCmX128thj3eE7zYrqCb0NxCi%2FOyXMxK8NHZu%2BTcEBkkqrcxaG2vwvqwBmRcPS0dQlTpXUku0gnvZCiwaLvoexZEmjMi4u4w9lQ6iAmAzrg%2BRaRb4OuU0ZeOEMT2KmOCmq%2FTXwhIdUR%2F8omMxJDz%2FfrXgnNNr5DfJQziMAG0VFAQ0fYB1CnAaI3tFFJzIYpgdK%2FyfAW7jp8ghWC6BaiWfxD7YOlJPA7TfzGB2LYTOpIw79Am8jT1EHiZ%2F9ACpYPgpKZCI6GdOH3Zmc0wW8q7g%3D%3D&txtRegistrationNumber=${regNo}&ReportViewerabcd%24ctl03%24ctl00=&ReportViewerabcd%24ctl03%24ctl01=&ReportViewerabcd%24ctl11=ltr&ReportViewerabcd%24ctl12=standards&ReportViewerabcd%24AsyncWait%24HiddenCancelField=False&ReportViewerabcd%24ToggleParam%24store=&ReportViewerabcd%24ToggleParam%24collapse=false&ReportViewerabcd%24ctl06%24ctl00%24CurrentPage=&ReportViewerabcd%24ctl06%24ctl03%24ctl00=&ReportViewerabcd%24ctl09%24ClientClickedId=&ReportViewerabcd%24ctl08%24store=&ReportViewerabcd%24ctl08%24collapse=false&ReportViewerabcd%24ctl10%24VisibilityState%24ctl00=None&ReportViewerabcd%24ctl10%24ScrollPosition=&ReportViewerabcd%24ctl10%24ReportControl%24ctl02=&ReportViewerabcd%24ctl10%24ReportControl%24ctl03=&ReportViewerabcd%24ctl10%24ReportControl%24ctl04=100&__ASYNCPOST=true&`;
}

// Request headers
function getHeaders() {
    return {
        'Accept': '*/*',
        'Accept-Language': 'en-IN,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'DNT': '1',
        'Origin': 'https://ums.lpu.in',
        'Referer': 'https://ums.lpu.in/lpuums/Reports/frmStudentTimeTable.aspx',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-MicrosoftAjax': 'Delta=true',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': COOKIES
    };
}

// Parse timetable HTML
function parseTimetable(html, regNo) {
    const classes = [];
    let section = '';

    // Extract table from AJAX response
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);

    if (!tableMatch) {
        console.log(`  No table found for ${regNo}`);
        return { section: '', classes: [] };
    }

    // Find the timetable table
    for (const tableHtml of tableMatch) {
        if (tableHtml.includes('Monday') || tableHtml.includes('Tuesday') || tableHtml.includes('AM') || tableHtml.includes('PM')) {
            const $ = cheerio.load(tableHtml);
            const $table = $('table');

            // Get headers
            const headers = [];
            $table.find('tr').first().find('td, th').each((i, cell) => {
                headers.push($(cell).text().trim());
            });

            // Map day columns
            const dayMapping = {
                'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
                'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday'
            };

            const dayColumns = {};
            headers.forEach((h, i) => {
                const lower = h.toLowerCase();
                for (const [key, value] of Object.entries(dayMapping)) {
                    if (lower.includes(key)) {
                        dayColumns[i] = value;
                    }
                }
            });

            // Process rows
            $table.find('tr').each((rowIdx, row) => {
                if (rowIdx === 0) return;

                let timeSlot = '';
                $(row).find('td, th').each((colIdx, cell) => {
                    const text = $(cell).text().trim();

                    if (colIdx === 0) {
                        timeSlot = text;
                        return;
                    }

                    if (!text || text === '-' || text === '') return;
                    if (text.toLowerCase().includes('project work')) return;

                    const day = dayColumns[colIdx];
                    if (!day) return;

                    // Parse time
                    const timeMatch = timeSlot.match(/(\d{1,2})[:\-](\d{1,2})\s*(AM|PM)?/i);
                    let startTime = null, endTime = null;

                    if (timeMatch) {
                        let startHour = parseInt(timeMatch[1]);
                        let endHour = parseInt(timeMatch[2]) || startHour + 1;
                        const period = timeMatch[3]?.toUpperCase();

                        if (period === 'PM' && startHour !== 12) startHour += 12;
                        if (period === 'PM' && endHour !== 12) endHour += 12;
                        if (!period && startHour <= 8) { startHour += 12; endHour += 12; }

                        startTime = `${startHour.toString().padStart(2, '0')}:00`;
                        endTime = `${endHour.toString().padStart(2, '0')}:00`;
                    }

                    // Parse cell content: "Lecture / G:All C:CSE310 / R: 25-301 / S:K22EI"
                    const courseMatch = text.match(/C:([A-Z]+\d+)/);
                    const roomMatch = text.match(/R:\s*([^\s\/]+)/);
                    const sectionMatch = text.match(/S:([A-Z0-9]+)/);
                    const isLecture = text.toLowerCase().includes('lecture');
                    const isPractical = text.toLowerCase().includes('practical');

                    if (courseMatch) {
                        if (sectionMatch && !section) section = sectionMatch[1];

                        classes.push({
                            day,
                            startTime,
                            endTime,
                            course: courseMatch[1],
                            room: roomMatch ? roomMatch[1] : 'TBD',
                            type: isPractical ? 'Practical' : 'Lecture'
                        });
                    }
                });
            });

            if (classes.length > 0) break;
        }
    }

    return { section, classes };
}

// Fetch timetable for one student
async function fetchTimetable(regNo) {
    try {
        const response = await axios.post(UMS_URL, buildRequestBody(regNo), {
            headers: getHeaders(),
            timeout: 30000
        });

        return parseTimetable(response.data, regNo);
    } catch (error) {
        console.log(`  Error fetching ${regNo}: ${error.message}`);
        return { section: '', classes: [] };
    }
}

// Main function
async function main() {
    console.log('========================================');
    console.log('LPU UMS Timetable Fetcher');
    console.log('========================================\n');
    console.log('⚠️  Make sure COOKIES variable has fresh cookies from browser!\n');

    const results = [];

    for (const student of STUDENTS) {
        console.log(`Fetching: ${student.name} (${student.regNo})...`);

        const timetable = await fetchTimetable(student.regNo);

        results.push({
            name: student.name,
            regNo: student.regNo,
            phone: student.phone,
            hasTimetable: timetable.classes.length > 0,
            timetable: timetable.classes.length > 0 ? timetable : null,
            eventsCreated: 0,
            lastSynced: null,
            syncStatus: 'pending'
        });

        console.log(`  ✓ Found ${timetable.classes.length} classes`);

        // Delay between requests
        await new Promise(r => setTimeout(r, 1000));
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
    console.log('========================================');
}

main().catch(console.error);
